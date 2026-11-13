<template>
  <!-- Tüm CRUD form sayfalarının temel şablonu.
       Oluştur / Düzenle / Görüntüle modunu route'dan otomatik belirler.
       vee-validate handleSubmit ile form validasyonunu yönetir. -->
  <div class="space-y-4">
    <form :id="formId" class="space-y-4" @submit="onSubmit">
      <!-- Sayfa başlığı + kaydet butonu (showHeader=false ile gizlenebilir) -->
      <PagesHeader
        v-if="showHeader"
        :title="pageTitle"
        :button-text="buttonText"
        button-type="submit"
        :show-button="!isView"
        :form-id="formId"
        @back="$emit('back')"
      />

      <!-- Form alanları: isView ve isEditMode slot prop olarak child'a geçirilir -->
      <slot :is-view="isView" :is-edit-mode="isEditMode" />

      <!-- Ek aksiyon butonları (opsiyonel) -->
      <slot name="actions" />
    </form>
  </div>
</template>

<script setup>
// BaseForm.vue — Tüm form sayfaları için temel şablon: oluştur/düzenle/görüntüle modu otomatik.
import { formatDate } from "../../../utils/date.ts";
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useFormContext } from "vee-validate";

const props = defineProps({
  formId: { type: String, required: true },
  titleCreate: { type: String, default: "" },
  titleEdit: { type: String, default: "" },
  titleView: { type: String, default: "" },
  redirectRoute: { type: [String, Function], default: null },
  createAction: { type: Function, required: true },
  updateAction: { type: Function, required: true },
  idParam: { type: String, default: "id" },
  showHeader: { type: Boolean, default: true },
  successMessageCreate: { type: String, default: "" },
  successMessageUpdate: { type: String, default: "" },
  errorMessageCreate: { type: String, default: "" },
  errorMessageUpdate: { type: String, default: "" },
  beforeSubmit: { type: Function, default: null },
});

const emit = defineEmits(["success", "error", "back"]);

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const localePath = useLocalePath();
const toast = useAppToast();
const confirm = useTailwindConfirm();

// Route'dan mod tespiti: /detail/ → görüntüleme, id var → düzenleme, yok → oluşturma
const isView = computed(() => route.path.includes("/detail/"));
const currentId = computed(() => route.params[props.idParam]);
const isEditMode = computed(() => !!currentId.value && !isView.value);

// Başlık ve buton metni moda göre değişir
const pageTitle = computed(() => {
  if (isView.value) return props.titleView;
  return isEditMode.value ? props.titleEdit : props.titleCreate;
});
const buttonText = computed(() => (isEditMode.value ? t("edit") : t("save")));

// vee-validate: handleSubmit yoksa (form context dışı kullanım) no-op wrapper kullan
const formContext = useFormContext();
const handleSubmit = formContext?.handleSubmit || ((fn) => fn);

// Kaydetme + başarı toast + yönlendirme (hem ilk gönderim hem onaylı tekrar için ortak)
const performSubmit = async (values) => {
  if (isEditMode.value) {
    await props.updateAction(currentId.value, values);
    toast.success(t(props.successMessageUpdate || "updated_successfully"));
  } else {
    await props.createAction(values);
    toast.success(t(props.successMessageCreate || "created_successfully"));
  }
  emit("success");
  // Yönlendirme: string veya factory fonksiyon olabilir
  if (props.redirectRoute) {
    const target = typeof props.redirectRoute === "function" ? props.redirectRoute() : props.redirectRoute;
    router.push(localePath(target));
  }
};

const showError = (error) => {
  const rawMsg = error?.data?.statusMessage || error?.statusMessage || error?.message || "";
  const fallback = isEditMode.value
    ? props.errorMessageUpdate || "update_error"
    : props.errorMessageCreate || "create_error";
  toast.error(t(rawMsg || fallback));
  emit("error", error);
};

const onSubmit = handleSubmit(async (rawValues) => {
  let values;
  try {
    // beforeSubmit hook: değerleri dönüştür veya null döndürerek iptal et
    values = props.beforeSubmit ? await props.beforeSubmit({ ...rawValues }) : rawValues;
    if (!values) return;
    await performSubmit(values);
  } catch (error) {
    // Geriye dönük SATIŞ belgesi → onaylanabilir uyarı (backend yalnız satışta 409 BACKDATE_WARNING döndürür).
    // "Evet" denirse confirmBackdate:true ile tekrar gönderilir; diğer işlemlerde bu hata HİÇ gelmez.
    if (error?.data?.data?.code === "BACKDATE_WARNING" && values) {
      const lastDate = error?.data?.data?.lastDate;
      const lastStr = formatDate(lastDate, "");
      confirm.require({
        header: t("v_backdate_header", "Geriye Dönük Tarih"),
        message: t("v_backdate_confirm", { date: lastStr }),
        icon: "pi pi-exclamation-triangle",
        acceptClass: "bg-yellow-500 hover:bg-yellow-600 text-white",
        acceptLabel: t("yes"),
        rejectLabel: t("no"),
        accept: async () => {
          try {
            await performSubmit({ ...values, confirmBackdate: true });
          } catch (e2) {
            showError(e2);
          }
        },
      });
      return;
    }
    showError(error);
  }
});
</script>
