// pos-ui/tooltip-directive.ts — PrimeVue kaldırıldıktan sonra `v-tooltip`in yerini alan ipucu balonu.
//
// NEDEN BU DOSYA VAR:
// PrimeVue projeden çıkarıldığında `v-tooltip` direktifi de gitti. 13 çağrı yeri
// (fatura listelerindeki Yazdır/Düzenle/Sil/Excel butonları) SESSİZCE ipucusuz
// kaldı — Vue tanımsız direktifte yalnız uyarı basar, çökmez. O butonlar
// yalnızca ikondan ibaret olduğu için ipucu kaybı gerçek bir kullanılabilirlik
// kaybıdır: kullanıcı hangi ikonun ne yaptığını göremez.
//
// SÖZLEŞME: PrimeVue'nun API'si BİREBİR korunur — `v-tooltip.top="metin"`.
// Böylece hiçbir çağrı yeri değişmez. Değiştiriciler: `.top` (varsayılan),
// `.bottom`, `.left`, `.right`.
//
// NEDEN NUXT'TAN BAĞIMSIZ (design-tokens.ts ile aynı desen):
// Konum hesabı ve temizlik mantığı ekranda değil TESTLE doğrulanmalı. Dosya
// `#app`ten bir şey import etseydi birim testi tüm Nuxt çalışma zamanını
// çekmek zorunda kalırdı. Kayıt işi ince bir eklentiye bırakıldı:
// packages/pos-ui/app/plugins/tooltip.client.ts

import type { DirectiveBinding, ObjectDirective } from "vue";

export type Placement = "top" | "bottom" | "left" | "right";

/** Balon ile hedef arasındaki boşluk (px) */
export const GAP = 8;

/** Balonun ekran kenarına bırakacağı en küçük boşluk (px) */
export const EDGE_PAD = 4;

/** Aynı anda tek balon yaşar — hızlı gezinmede balon birikmesini önler */
let bubble: HTMLElement | null = null;

/**
 * Elemana iliştirilen durum. Dinleyiciler `onShow`/`onHide` SABİT
 * fonksiyonlarına bağlanır; `binding` her `updated`da tazelenir. Böylece
 * ipucu metni değişince dinleyiciyi sökmek gerekmez — mount anındaki
 * closure'a saplanıp eski metni göstermeyiz.
 */
type State = {
  binding: DirectiveBinding;
  onShow: () => void;
  onHide: () => void;
};

const STATE = Symbol("ui-tooltip");

type Holder = Record<symbol, State | undefined>;

/** binding.value string ya da PrimeVue tarzı `{ value }` nesnesi olabilir */
export function textOf(binding: Pick<DirectiveBinding, "value">): string {
  const v = binding.value;
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && typeof v.value === "string") return v.value;
  return "";
}

export function placementOf(binding: Pick<DirectiveBinding, "modifiers">): Placement {
  for (const p of ["bottom", "left", "right"] as const) {
    if (binding.modifiers?.[p]) return p;
  }
  return "top";
}

/**
 * Balonun sol-üst köşesini hesaplar (viewport koordinatı).
 * Saf fonksiyon: DOM'a dokunmaz, doğrudan test edilir.
 */
export function positionFor(
  target: { top: number; left: number; right: number; bottom: number; width: number; height: number },
  size: { width: number; height: number },
  placement: Placement,
  viewport: { width: number; height: number },
): { top: number; left: number } {
  let top: number;
  let left: number;

  switch (placement) {
    case "bottom":
      top = target.bottom + GAP;
      left = target.left + target.width / 2 - size.width / 2;
      break;
    case "left":
      top = target.top + target.height / 2 - size.height / 2;
      left = target.left - size.width - GAP;
      break;
    case "right":
      top = target.top + target.height / 2 - size.height / 2;
      left = target.right + GAP;
      break;
    default:
      top = target.top - size.height - GAP;
      left = target.left + target.width / 2 - size.width / 2;
  }

  // Ekran dışına taşmayı engelle — tablo sağ kenarındaki aksiyon butonlarında
  // balon aksi hâlde kesiliyordu (asıl sorun buydu).
  left = Math.min(Math.max(EDGE_PAD, left), viewport.width - size.width - EDGE_PAD);
  top = Math.min(Math.max(EDGE_PAD, top), viewport.height - size.height - EDGE_PAD);

  return { top, left };
}

/** Ekranda açık balon varsa kaldırır */
export function destroyTooltip() {
  bubble?.remove();
  bubble = null;
}

/** Test amaçlı: şu an açık olan balon düğümü */
export function currentTooltip(): HTMLElement | null {
  return bubble;
}

export function showTooltip(el: HTMLElement, text: string, placement: Placement) {
  destroyTooltip();
  if (!text) return;

  const node = document.createElement("div");
  node.setAttribute("role", "tooltip");
  node.textContent = text;
  // Görünüm tokens.css'teki `.ui-tooltip` sözleşmesinden gelir; burada yalnız
  // konum var çünkü konum çalışma zamanında hesaplanmak zorunda.
  node.className = "ui-tooltip";
  node.style.position = "fixed";
  node.style.visibility = "hidden";
  document.body.appendChild(node);

  const r = el.getBoundingClientRect();
  const b = node.getBoundingClientRect();
  const { top, left } = positionFor(r, b, placement, {
    width: window.innerWidth,
    height: window.innerHeight,
  });

  node.style.top = `${top}px`;
  node.style.left = `${left}px`;
  node.style.visibility = "visible";
  bubble = node;
}

export const tooltipDirective: ObjectDirective<HTMLElement> = {
  mounted(el, binding) {
    const state: State = {
      binding,
      onShow: () => showTooltip(el, textOf(state.binding), placementOf(state.binding)),
      onHide: destroyTooltip,
    };
    (el as unknown as Holder)[STATE] = state;

    el.addEventListener("mouseenter", state.onShow);
    el.addEventListener("focus", state.onShow);
    el.addEventListener("mouseleave", state.onHide);
    el.addEventListener("blur", state.onHide);
    // Tıklayınca balon ekranda asılı kalmasın (buton çoğu zaman sayfayı değiştirir)
    el.addEventListener("click", state.onHide);
  },

  updated(el, binding) {
    const state = (el as unknown as Holder)[STATE];
    // Yalnız binding tazelenir — dinleyiciler sabit kaldığı için sökme yok.
    if (state) state.binding = binding;
  },

  beforeUnmount(el) {
    const holder = el as unknown as Holder;
    const state = holder[STATE];
    if (state) {
      el.removeEventListener("mouseenter", state.onShow);
      el.removeEventListener("focus", state.onShow);
      el.removeEventListener("mouseleave", state.onHide);
      el.removeEventListener("blur", state.onHide);
      el.removeEventListener("click", state.onHide);
      delete holder[STATE];
    }
    destroyTooltip();
  },
};
