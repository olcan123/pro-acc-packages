// index.d.ts — @pro-acc/ui-vue tip bildirimleri. Bileşenler JS SFC olduğundan props tipleri gevşektir (any);
// composable ve yardımcıların imzaları kaynakla eşleşir.
import type { DefineComponent, Directive, Plugin } from "vue";
import type { $Fetch } from "ofetch";
import type { RouteLocationRaw, Router } from "vue-router";

type AnyComponent = DefineComponent<Record<string, any>, Record<string, any>, any>;

export interface ProAccUiConfig {
  navigate: (to: RouteLocationRaw) => unknown;
  localePath: (path: string) => string;
  fetch: $Fetch;
}
export interface ProAccUiOptions extends Partial<ProAccUiConfig> {
  router?: Router;
  tooltip?: boolean;
}
export declare const ProAccUi: Plugin<[ProAccUiOptions?]>;
export declare function configureProAccUi(options: Partial<ProAccUiConfig>): void;
export declare function resetProAccUiConfig(): void;
export declare function uiNavigate(to: RouteLocationRaw): unknown;
export declare function uiLocalePath(path: string): string;
export declare const uiFetch: $Fetch;

// Bileşenler
export declare const LoginForm: AnyComponent;
export declare const AuthLoginForm: AnyComponent;
export declare const FieldAutocomplete: AnyComponent;
export declare const FormFieldAutocomplete: AnyComponent;
export declare const FieldBadge: AnyComponent;
export declare const FormFieldBadge: AnyComponent;
export declare const FieldButton: AnyComponent;
export declare const FormFieldButton: AnyComponent;
export declare const FieldCheckbox: AnyComponent;
export declare const FormFieldCheckbox: AnyComponent;
export declare const FieldConfirmDialog: AnyComponent;
export declare const FormFieldConfirmDialog: AnyComponent;
export declare const FieldDateInput: AnyComponent;
export declare const FormFieldDateInput: AnyComponent;
export declare const FieldDropdown: AnyComponent;
export declare const FormFieldDropdown: AnyComponent;
export declare const FieldDropdownItem: AnyComponent;
export declare const FormFieldDropdownItem: AnyComponent;
export declare const FieldHeaderActions: AnyComponent;
export declare const FormFieldHeaderActions: AnyComponent;
export declare const FieldImageUpload: AnyComponent;
export declare const FormFieldImageUpload: AnyComponent;
export declare const FieldNumberInput: AnyComponent;
export declare const FormFieldNumberInput: AnyComponent;
export declare const FieldPasswordInput: AnyComponent;
export declare const FormFieldPasswordInput: AnyComponent;
export declare const FieldSelect: AnyComponent;
export declare const FormFieldSelect: AnyComponent;
export declare const FieldTextArea: AnyComponent;
export declare const FormFieldTextArea: AnyComponent;
export declare const FieldTextInput: AnyComponent;
export declare const FormFieldTextInput: AnyComponent;
export declare const Modal: AnyComponent;
export declare const SharedModal: AnyComponent;
export declare const ReportAmountCell: AnyComponent;
export declare const SharedReportAmountCell: AnyComponent;
export declare const UpdateNotice: AnyComponent;
export declare const SharedUpdateNotice: AnyComponent;
export declare const ChangeLogDiff: AnyComponent;
export declare const PagesAuditChangeLogDiff: AnyComponent;
export declare const PagesHeaderContent: AnyComponent;
export declare const PagesHeader: AnyComponent;
export declare const AnalyticsReport: AnyComponent;
export declare const SharedAnalyticsReport: AnyComponent;
export declare const AttachmentPanel: AnyComponent;
export declare const SharedAttachmentPanel: AnyComponent;
export declare const BaseForm: AnyComponent;
export declare const SharedBaseForm: AnyComponent;
export declare const BaseList: AnyComponent;
export declare const SharedBaseList: AnyComponent;
export declare const BookView: AnyComponent;
export declare const SharedBookView: AnyComponent;
export declare const DateRangeFilter: AnyComponent;
export declare const SharedDateRangeFilter: AnyComponent;
export declare const ExcelImport: AnyComponent;
export declare const SharedExcelImport: AnyComponent;
export declare const FormLineCard: AnyComponent;
export declare const SharedFormLineCard: AnyComponent;
export declare const ImportGuide: AnyComponent;
export declare const SharedImportGuide: AnyComponent;
export declare const IndirectCostFields: AnyComponent;
export declare const SharedIndirectCostFields: AnyComponent;
export declare const LedgerTable: AnyComponent;
export declare const SharedLedgerTable: AnyComponent;
export declare const RecordHistory: AnyComponent;
export declare const SharedRecordHistory: AnyComponent;
export declare const ReportSearchBar: AnyComponent;
export declare const SharedReportSearchBar: AnyComponent;
export declare const RoutingTable: AnyComponent;
export declare const SharedRoutingTable: AnyComponent;

// Composable'lar
type ToastFn = (messageOrOptions: string | Record<string, unknown>) => void;
export declare function useAppToast(): { success: ToastFn; error: ToastFn; info: ToastFn; warning: ToastFn; show: ToastFn };
export declare const UPDATE_ASKED_KEY: string;
export declare function useAppUpdate(): any;
export declare function useConfirmDelete(): {
  confirmDelete(options: { message: string; onAccept: () => unknown; header?: string; icon?: string }): void;
};
export declare function useCurrency(): {
  formatCurrency(value: unknown): string;
  parseCurrency(value: unknown): number;
  sumCurrency(values: unknown[]): number;
};
export declare function useErrorText(errorMessage: any): any;
export declare function useFieldInputState(errorMessage: any, value: any, isShowSuccess?: any, disabled?: any, size?: any): any;
export declare function useFieldBadge(severity: any, size?: any): any;
export declare const SEF_FALLBACK_CATEGORY_CODE: string;
export declare function sefCategoryI18nKey(sefNo: unknown): string;
export declare function resolveSefCategoryCode(category: unknown): string;
export declare function useSefCategoryLabel(i18n?: any): any;
export interface ConfirmOptions {
  message: string;
  header?: string;
  icon?: string;
  acceptLabel?: string;
  rejectLabel?: string;
  acceptClass?: string;
  rejectClass?: string;
  accept?: () => void;
  reject?: () => void;
}
export declare function useTailwindConfirm(): {
  isVisible: import("vue").Ref<boolean>;
  options: import("vue").Ref<ConfirmOptions | null>;
  require(options: ConfirmOptions): void;
  accept(): void;
  reject(): void;
  close(): void;
};
export declare function unitI18nKey(code: unknown): string;
export declare function useUnitLabel(i18n?: any): any;
export declare function periodRange(preset: string): { from: string; to: string };
export declare function formatNumber(n: unknown, digits?: number, maxDigits?: number | null): string;
export declare function useAnalyticsReport(endpoint: string, options?: Record<string, unknown>): any;
export declare function useExcelExport(): {
  exportToExcel(data: Record<string, unknown>[], filename?: string, sheetName?: string): Promise<void>;
  exportAoaToExcel(...args: any[]): Promise<void>;
};
export { buildReportHtml, useReportPrint } from "./erp/composables/useReportPrint.ts";

// Yardımcılar
export { formatDate, formatDateTime } from "./utils/date.ts";
export * from "./utils/cash-count.ts";
export * from "./utils/cash-limit.ts";
export declare const MAX_IMPORT_BYTES: number;
export declare const MAX_IMPORT_ROWS: number;
export declare class ExcelImportError extends Error {
  key: string;
  params?: Record<string, unknown>;
}
export declare function assertExcelFileSize(file: File | Blob): void;
export declare function readFirstSheetRows(data: ArrayBuffer | Uint8Array, options?: Record<string, unknown>): Promise<Record<string, unknown>[]>;
export declare function readNamedSheetsRows(data: ArrayBuffer | Uint8Array, required: string[], optional?: string[], options?: Record<string, unknown>): Promise<Record<string, Record<string, unknown>[]>>;
export declare const tooltipDirective: Directive<HTMLElement>;
export * as designTokens from "./design-tokens.ts";
