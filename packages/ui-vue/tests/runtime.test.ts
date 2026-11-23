// runtime.test.ts — Paket düz bir Vue uygulamasında (Nuxt YOK) çalışır: ProAccUi eklentisi router'la gezinir; BaseList
// (PagesHeader → FieldHeaderActions → LedgerTable zinciri) çizer ve "ekle" ile gider; BaseForm kaydeder, bildirir,
// yönlendirir; useConfirmDelete + FieldConfirmDialog; FieldDropdown öğesi gezinir; uiFetch yapılandırılabilir;
// IndirectCostFields hesapları prop'tan alır; dışa aktarım listesi her bileşeni içerir; Excel okuyucu CDN'siz çalışır.
import { readdirSync } from "node:fs";
import { relative, resolve } from "node:path";
import { flushPromises, mount } from "@vue/test-utils";
import iziToast from "izitoast";
import { useForm } from "vee-validate";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";
import { createI18n } from "vue-i18n";
import { createMemoryHistory, createRouter } from "vue-router";
import * as ui from "../src/index.js";
import tr from "../src/locales/tr.json";

const Blank = { template: "<div />" };
const i18n = createI18n({ legacy: false, locale: "tr", messages: { tr }, missingWarn: false, fallbackWarn: false });
const t = (key: string) => i18n.global.t(key);

function setup(path = "/") {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", component: Blank },
      { path: "/units", component: Blank },
      { path: "/units/create", component: Blank },
    ],
  });
  return router.push(path).then(() => ({ router, plugins: [router, i18n, { install: (a: any) => a.use(ui.ProAccUi, { router }) }] }));
}

afterEach(() => {
  ui.resetProAccUiConfig();
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("dışa aktarım", () => {
  it("src/components ve src/erp/components altındaki her .vue hem dosya hem Nuxt adıyla dışa aktarılır", () => {
    const root = resolve(__dirname, "../src");
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(resolve(dir, e.name)) : e.name.endsWith(".vue") ? [resolve(dir, e.name)] : [],
      );
    const files = [...walk(resolve(root, "components")), ...walk(resolve(root, "erp/components"))];
    const exported = new Set(Object.values(ui).filter((v) => v && typeof v === "object" && "__name" in (v as object)));
    const names = files.map((f) => relative(root, f));
    expect(exported.size).toBe(names.length);
    for (const name of ["FieldButton", "FormFieldButton", "BaseList", "SharedBaseList", "PagesHeader", "SharedLedgerTable"]) {
      expect(ui, name).toHaveProperty(name);
    }
    expect(ui.FieldButton).toBe(ui.FormFieldButton);
  });
});

describe("ProAccUi + BaseList (Nuxt'suz)", () => {
  it("başlık ve satırlar çizilir; 'ekle' createRoute'a router ile gider", async () => {
    const { router, plugins } = await setup();
    const w = mount(ui.BaseList, {
      props: {
        title: "Birimler",
        createRoute: "/units/create",
        data: [
          { id: "a", name: "Adet" },
          { id: "b", name: "Kilogram" },
        ],
        columns: [{ field: "name", header: "Ad" }],
      },
      global: { plugins },
    });
    await flushPromises();
    expect(w.text()).toContain("Kilogram");
    await w.findAll("button").find((b) => b.text().includes(t("add")))!.trigger("click");
    await flushPromises();
    expect(router.currentRoute.value.path).toBe("/units/create");
  });

  it("localePath yapılandırılırsa gezinme önekli yola gider (Nuxt prefix_except_default karşılığı)", async () => {
    const navigate = vi.fn();
    ui.configureProAccUi({ navigate, localePath: (p) => `/sq${p}` });
    ui.uiNavigate("/units");
    expect(navigate).toHaveBeenCalledWith("/sq/units");
  });
});

describe("BaseForm (Nuxt'suz)", () => {
  it("oluşturma: createAction → başarı bildirimi → redirectRoute", async () => {
    const { router, plugins } = await setup("/units/create");
    const success = vi.spyOn(iziToast, "success").mockImplementation(() => {});
    const createAction = vi.fn().mockResolvedValue({ id: "u1" });
    const Page = defineComponent({
      setup() {
        useForm({ initialValues: { name: "Kutu" } });
        return () =>
          h(ui.BaseForm, {
            formId: "f",
            titleCreate: "Yeni birim",
            createAction,
            updateAction: vi.fn(),
            redirectRoute: "/units",
          });
      },
    });
    const w = mount(Page, { global: { plugins }, attachTo: document.body });
    expect(w.text()).toContain("Yeni birim");
    await w.find("form").trigger("submit");
    await flushPromises();
    expect(createAction).toHaveBeenCalledWith({ name: "Kutu" });
    expect(success).toHaveBeenCalledWith(expect.objectContaining({ message: t("created_successfully"), position: "bottomRight" }));
    expect(router.currentRoute.value.path).toBe("/units");
    w.unmount();
  });
});

describe("silme onayı", () => {
  it("useConfirmDelete diyaloğu açar; onaylanınca silme çalışır ve bildirilir", async () => {
    const success = vi.spyOn(iziToast, "success").mockImplementation(() => {});
    const onAccept = vi.fn().mockResolvedValue(undefined);
    const Page = defineComponent({
      setup() {
        const { confirmDelete } = ui.useConfirmDelete();
        return () =>
          h("div", [
            h("button", { id: "del", onClick: () => confirmDelete({ message: "Silinsin mi?", onAccept }) }, "sil"),
            h(ui.FieldConfirmDialog),
          ]);
      },
    });
    const w = mount(Page, { global: { plugins: [i18n] }, attachTo: document.body });
    await w.find("#del").trigger("click");
    await flushPromises();
    expect(document.body.textContent).toContain("Silinsin mi?");
    [...document.body.querySelectorAll("button")].find((b) => b.textContent?.trim() === t("confirm"))!.click();
    await flushPromises();
    expect(onAccept).toHaveBeenCalledOnce();
    expect(success).toHaveBeenCalledWith(expect.objectContaining({ message: t("deleted_successfully") }));
    w.unmount();
  });
});

describe("FieldDropdown", () => {
  it("öğe `to` ile router'dan gider, `action` ile fonksiyonu çağırır", async () => {
    const { router, plugins } = await setup();
    const action = vi.fn();
    const w = mount(ui.FieldDropdown, {
      props: { items: [{ label: "Birimler", to: "/units" }, { label: "Yazdır", action }] },
      global: { plugins },
      attachTo: document.body,
    });
    await w.find("button").trigger("click");
    await w.findAll("li button").find((b) => b.text() === "Yazdır")!.trigger("click");
    expect(action).toHaveBeenCalledOnce();
    await w.find("button").trigger("click");
    await w.findAll("li button").find((b) => b.text() === "Birimler")!.trigger("click");
    await flushPromises();
    expect(router.currentRoute.value.path).toBe("/units");
    w.unmount();
  });
});

describe("uiFetch", () => {
  it("yapılandırılan HTTP istemcisini çağrı anında kullanır", async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true });
    ui.configureProAccUi({ fetch: fetch as never });
    await expect(ui.uiFetch("/api/x", { method: "GET" })).resolves.toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledWith("/api/x", { method: "GET" });
  });
});

describe("IndirectCostFields", () => {
  it("yansıtma hesaplarını uygulama store'u yerine `accounts` prop'undan alır (yalnız 5xxx alt hesaplar)", () => {
    const w = mount(ui.IndirectCostFields, {
      props: {
        accounts: [
          { id: "1", code: "5000", name: "Gider" },
          { id: "2", code: "5100.0001", name: "İşçilik" },
          { id: "3", code: "1150.0001", name: "Depo" },
        ],
      },
      global: { plugins: [i18n] },
    });
    const options = w.findAll("option").map((o) => o.text());
    expect(options).toContain("5100.0001 - İşçilik");
    expect(options.some((o) => o.startsWith("1150"))).toBe(false);
    expect(options.some((o) => o.startsWith("5000 "))).toBe(false);
  });
});

describe("Excel okuyucu", () => {
  it("dış proje veya CDN gerektirmeden çalışma kitabını okur", async () => {
    const xlsx = await import("../src/vendor/xlsx.mjs");
    const book = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(book, xlsx.utils.aoa_to_sheet([["Kod", "Ad"], ["P01", "Ürün"]]), "Ürünler");
    const bytes = xlsx.write(book, { type: "array", bookType: "xlsx" });
    expect(await ui.readFirstSheetRows(bytes)).toEqual([{ Kod: "P01", Ad: "Ürün" }]);
    await expect(ui.readNamedSheetsRows(bytes, ["Eksik"])).rejects.toMatchObject({ key: "v_import_missing_sheets" });
  });
});
