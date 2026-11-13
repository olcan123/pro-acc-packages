<template>
  <div class="rounded-sm border border-paper-300 p-4 dark:border-paper-800">
    <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
      <p class="text-2xs font-bold tracking-widest text-paper-500 uppercase dark:text-paper-400">
        <i class="pi pi-paperclip mr-1" />{{ $t("attachments", "Belge Ekleri") }}
        <span v-if="rows.length" class="ml-1">({{ rows.length }})</span>
      </p>

      <label v-if="!disabled && entityId" class="cursor-pointer">
        <span
          class="inline-flex items-center rounded-sm bg-blue-600 px-3 py-1.5 text-2xs font-bold text-white hover:bg-blue-700"
        >
          <i class="pi pi-upload mr-1" />{{ $t("attachment_upload", "Belge Yükle") }}
        </span>
        <input type="file" multiple class="hidden" :disabled="uploading" @change="onPick" />
      </label>
    </div>

    <p v-if="uploading" class="text-sm text-paper-500"><i class="pi pi-spin pi-spinner mr-2" />{{ $t("loading") }}</p>

    <!-- Kayıt henüz oluşmadıysa ek yüklenemez: entityId olmadan neye bağlanacağı belirsizdir -->
    <p v-else-if="!entityId" class="text-sm text-paper-500">
      {{ $t("attachment_save_first", "Belge eklemek için önce kaydı kaydedin.") }}
    </p>

    <p v-else-if="rows.length === 0" class="text-sm text-paper-500">
      {{ $t("attachment_none", "Bu işleme henüz belge eklenmemiş.") }}
    </p>

    <ul v-else class="divide-y divide-paper-200 dark:divide-paper-800">
      <li v-for="row in rows" :key="row.id" class="flex items-center gap-3 py-2">
        <i class="pi text-paper-500" :class="iconFor(row)" />
        <a
          :href="row.filePath"
          target="_blank"
          rel="noopener"
          class="min-w-0 flex-1 truncate text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          {{ row.fileName }}
        </a>
        <span class="shrink-0 text-2xs text-paper-500">{{ humanSize(row.fileSize) }}</span>
        <FormFieldButton
          v-if="!disabled"
          icon="pi pi-trash"
          text
          size="small"
          severity="danger"
          :aria-label="$t('delete')"
          @click="remove(row)"
        />
      </li>
    </ul>
  </div>
</template>

<script setup>
// AttachmentPanel.vue — Herhangi bir kayda belge eki iliştirme paneli (Ligji 08/L-257).
//
// KULLANIM: <SharedAttachmentPanel entity-type="ORDER" :entity-id="order.id" />
// entityType değerleri server/service/attachment.service.ts içindeki
// ATTACHMENT_ENTITY_TYPES listesiyle AYNI olmalıdır.
import { ref, watch, onMounted } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps({
  entityType: { type: String, required: true },
  // Kayıt henüz oluşmadıysa null olabilir → panel "önce kaydedin" der.
  entityId: { type: [Number, String], default: null },
  disabled: { type: Boolean, default: false },
});

// useAppToast / useConfirmDelete packages/pos-ui katmanından auto-import edilir.
// Toast ÇEVRİLMİŞ metin bekler (anahtar değil) → t() ile çevrilir.
const { t } = useI18n();
const toast = useAppToast();
const { confirmDelete } = useConfirmDelete();

const rows = ref([]);
const uploading = ref(false);

/** Uzantıya göre ikon — PDF/resim/tablo ayrımı listeyi hızlı taranabilir yapar. */
function iconFor(row) {
  const name = (row.fileName || "").toLowerCase();
  if (name.endsWith(".pdf")) return "pi-file-pdf";
  if (/\.(png|jpe?g|webp|gif|heic)$/.test(name)) return "pi-image";
  if (/\.(xlsx?|csv)$/.test(name)) return "pi-file-excel";
  return "pi-file";
}

/** Bayt → okunabilir boyut. */
function humanSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function load() {
  if (!props.entityId) {
    rows.value = [];
    return;
  }
  try {
    const res = await $fetch("/api/attachments", {
      query: { entityType: props.entityType, entityId: props.entityId },
    });
    rows.value = res?.rows ?? [];
  } catch {
    rows.value = [];
  }
}

async function onPick(event) {
  const files = Array.from(event.target.files || []);
  if (files.length === 0) return;

  const form = new FormData();
  form.append("entityType", props.entityType);
  form.append("entityId", String(props.entityId));
  for (const file of files) form.append("file", file);

  uploading.value = true;
  try {
    await $fetch("/api/attachments", { method: "POST", body: form });
    toast.success(t("attachment_uploaded"));
    await load();
  } catch (e) {
    toast.error(t(e?.data?.statusMessage || "v_attachment_upload_error"));
  } finally {
    uploading.value = false;
    // Aynı dosya art arda seçilebilsin diye girdi sıfırlanır
    event.target.value = "";
  }
}

function remove(row) {
  // confirmDelete geri-çağrı tabanlıdır (promise DÖNDÜRMEZ): başarı/hata toast'ını
  // kendisi gösterir, bu yüzden burada yalnız silme işi verilir.
  confirmDelete({
    message: t("attachment_delete_confirm", { name: row.fileName }),
    onAccept: async () => {
      await $fetch(`/api/attachments/${row.id}`, { method: "DELETE" });
      rows.value = rows.value.filter((r) => r.id !== row.id);
    },
  });
}

watch(() => props.entityId, load);
onMounted(load);
</script>
