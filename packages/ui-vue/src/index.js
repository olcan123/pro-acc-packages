// index.js — @pro-acc/ui-vue giriş noktası (ÜRETİLMİŞ düzen: bileşen listesi tests/exports.test.ts ile denetlenir).
// Her bileşen iki adla verilir: dosya adı (FieldButton) ve Nuxt'taki otomatik adı (FormFieldButton, SharedBaseList …);
// böylece nuxt şablonları değiştirilmeden düz Vue'ya taşınır.

// ── Kurulum ve yapılandırma ──
export { ProAccUi } from "./plugin.ts";
export { configureProAccUi, resetProAccUiConfig, uiFetch, uiLocalePath, uiNavigate } from "./config.ts";

// ── Bileşenler ──
export { default as LoginForm, default as AuthLoginForm } from "./components/auth/LoginForm.vue";
export { default as FieldAutocomplete, default as FormFieldAutocomplete } from "./components/form/FieldAutocomplete.vue";
export { default as FieldBadge, default as FormFieldBadge } from "./components/form/FieldBadge.vue";
export { default as FieldButton, default as FormFieldButton } from "./components/form/FieldButton.vue";
export { default as FieldCheckbox, default as FormFieldCheckbox } from "./components/form/FieldCheckbox.vue";
export { default as FieldConfirmDialog, default as FormFieldConfirmDialog } from "./components/form/FieldConfirmDialog.vue";
export { default as FieldDateInput, default as FormFieldDateInput } from "./components/form/FieldDateInput.vue";
export { default as FieldDropdown, default as FormFieldDropdown } from "./components/form/FieldDropdown.vue";
export { default as FieldDropdownItem, default as FormFieldDropdownItem } from "./components/form/FieldDropdownItem.vue";
export { default as FieldHeaderActions, default as FormFieldHeaderActions } from "./components/form/FieldHeaderActions.vue";
export { default as FieldImageUpload, default as FormFieldImageUpload } from "./components/form/FieldImageUpload.vue";
export { default as FieldNumberInput, default as FormFieldNumberInput } from "./components/form/FieldNumberInput.vue";
export { default as FieldPasswordInput, default as FormFieldPasswordInput } from "./components/form/FieldPasswordInput.vue";
export { default as FieldSelect, default as FormFieldSelect } from "./components/form/FieldSelect.vue";
export { default as FieldTextArea, default as FormFieldTextArea } from "./components/form/FieldTextArea.vue";
export { default as FieldTextInput, default as FormFieldTextInput } from "./components/form/FieldTextInput.vue";
export { default as Modal, default as SharedModal } from "./components/shared/Modal.vue";
export { default as ReportAmountCell, default as SharedReportAmountCell } from "./components/shared/ReportAmountCell.vue";
export { default as UpdateNotice, default as SharedUpdateNotice } from "./components/shared/UpdateNotice.vue";
export { default as ChangeLogDiff, default as PagesAuditChangeLogDiff } from "./erp/components/pages/audit/ChangeLogDiff.vue";
export { default as PagesHeaderContent } from "./erp/components/pages/header/content.vue";
export { default as PagesHeader } from "./erp/components/pages/header/index.vue";
export { default as AnalyticsReport, default as SharedAnalyticsReport } from "./erp/components/shared/AnalyticsReport.vue";
export { default as AttachmentPanel, default as SharedAttachmentPanel } from "./erp/components/shared/AttachmentPanel.vue";
export { default as BaseForm, default as SharedBaseForm } from "./erp/components/shared/BaseForm.vue";
export { default as BaseList, default as SharedBaseList } from "./erp/components/shared/BaseList.vue";
export { default as BookView, default as SharedBookView } from "./erp/components/shared/BookView.vue";
export { default as DateRangeFilter, default as SharedDateRangeFilter } from "./erp/components/shared/DateRangeFilter.vue";
export { default as ExcelImport, default as SharedExcelImport } from "./erp/components/shared/ExcelImport.vue";
export { default as FormLineCard, default as SharedFormLineCard } from "./erp/components/shared/FormLineCard.vue";
export { default as ImportGuide, default as SharedImportGuide } from "./erp/components/shared/ImportGuide.vue";
export { default as IndirectCostFields, default as SharedIndirectCostFields } from "./erp/components/shared/IndirectCostFields.vue";
export { default as LedgerTable, default as SharedLedgerTable } from "./erp/components/shared/LedgerTable.vue";
export { default as RecordHistory, default as SharedRecordHistory } from "./erp/components/shared/RecordHistory.vue";
export { default as ReportSearchBar, default as SharedReportSearchBar } from "./erp/components/shared/ReportSearchBar.vue";
export { default as RoutingTable, default as SharedRoutingTable } from "./erp/components/shared/RoutingTable.vue";

// ── Composable'lar ──
export { useAppToast } from "./composables/useAppToast.ts";
export { useAppUpdate, UPDATE_ASKED_KEY } from "./composables/useAppUpdate.js";
export { useConfirmDelete } from "./composables/useConfirmDelete.js";
export { useCurrency } from "./composables/useCurrency.js";
export { useErrorText, useFieldBadge, useFieldInputState } from "./composables/useFormStyles.js";
export { resolveSefCategoryCode, SEF_FALLBACK_CATEGORY_CODE, sefCategoryI18nKey, useSefCategoryLabel } from "./composables/useSefCategoryLabel.js";
export { useTailwindConfirm } from "./composables/useTailwindConfirm.ts";
export { unitI18nKey, useUnitLabel } from "./composables/useUnitLabel.js";
export { formatNumber, periodRange, useAnalyticsReport } from "./erp/composables/useAnalyticsReport.js";
export { useExcelExport } from "./erp/composables/useExcelExport.js";
export { buildReportHtml, useReportPrint } from "./erp/composables/useReportPrint.ts";

// ── Yardımcılar ──
export { formatDate, formatDateTime } from "./utils/date.ts";
export * from "./utils/cash-count.ts";
export * from "./utils/cash-limit.ts";
export { assertExcelFileSize, ExcelImportError, MAX_IMPORT_BYTES, MAX_IMPORT_ROWS, readFirstSheetRows, readNamedSheetsRows } from "./erp/utils/excel-read.js";
export { tooltipDirective } from "./tooltip-directive.ts";
export * as designTokens from "./design-tokens.ts";
