<!-- pages/settings.vue — Elle kurulum: Main API adresi/anahtarı, cihaz kimliği, depo, varsayılan cari, terminaller.
     pos + restoran ORTAK sayfasıdır. Uygulama farkları app.config ve runtimeConfig.public'ten gelir:
       appConfig.settingsTitleKey  → başlık i18n anahtarı (POS "pos_settings", restoran "settings")
       appConfig.showSettingsBack  → geri butonu (restoranda navbar'daki "Masalar" ile dönülür)
       config.public.terminalNameField → ayar kaydındaki cihaz adı alanı (posName ↔ restaurantName) -->
<template>
  <div class="max-w-3xl mx-auto flex flex-col gap-5">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-paper-900 dark:text-paper-100">
        <i class="pi pi-cog mr-2" />{{ $t(titleKey) }}
      </h1>
      <NuxtLink v-if="showBack" to="/" class="btn-base btn-secondary btn-size-sm rounded-lg">
        <i class="pi pi-arrow-left mr-1" />{{ $t("back") }}
      </NuxtLink>
    </div>

    <!-- Main bağlantısı -->
    <section class="card-panel p-5">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-semibold text-paper-800 dark:text-paper-200">
          <i class="pi pi-server mr-2 text-blue-600" />{{ $t("main_connection") }}
        </h2>
        <!-- Bağlantı durum badge'i -->
        <span v-if="connectionStatus === 'ok'" class="badge-base badge-success badge-size-sm flex items-center gap-1">
          <i class="pi pi-check-circle" />{{ $t('connection_ok') }}
        </span>
        <span v-else-if="connectionStatus === 'error'" class="badge-base badge-danger badge-size-sm flex items-center gap-1">
          <i class="pi pi-times-circle" />{{ $t('connection_failed') }}
        </span>
        <span v-else class="badge-base badge-size-sm bg-gray-100 dark:bg-gray-700 text-paper-600 dark:text-paper-400 flex items-center gap-1">
          <i class="pi pi-minus-circle" />{{ $t('not_synced') }}
        </span>
      </div>

      <div class="flex flex-col gap-4">
        <div>
          <label class="field-label field-label-default">{{ $t("main_api_url") }}</label>
          <input
            v-model="form.mainApiUrl"
            type="text"
            class="field-input-base field-input-default field-size-md"
            placeholder="https://erp.firma.com"
            @keydown.enter="connectAndSync"
          >
          <p class="mt-1 text-xs text-paper-500 dark:text-paper-400">{{ $t("main_api_url_hint") }}</p>
        </div>
        <div>
          <label class="field-label field-label-default">{{ $t("sync_key") }}</label>
          <input
            v-model="form.syncKey"
            type="text"
            class="field-input-base field-input-default field-size-md"
            placeholder="x-pos-key"
            @keydown.enter="connectAndSync"
          >
        </div>

        <!-- Son senkron bilgisi -->
        <p v-if="settingsStore.settings?.lastSync" class="text-xs text-paper-500 dark:text-paper-400">
          <i class="pi pi-clock mr-1" />
          {{ $t('last_sync') }}: {{ fmtDate(settingsStore.settings.lastSync) }}
        </p>

        <!-- Tek aksiyon butonu -->
        <div>
          <button
            class="btn-base btn-primary btn-size-md rounded-lg w-full sm:w-auto flex items-center justify-center gap-2"
            :disabled="busy || !form.mainApiUrl"
            @click="connectAndSync"
          >
            <i :class="busy ? 'pi pi-spin pi-spinner' : 'pi pi-cloud-download'" />
            {{ $t('connect_and_sync') }}
          </button>
          <p class="mt-2 text-xs text-paper-500 dark:text-paper-400">
            <i class="pi pi-info-circle mr-1" />{{ $t('connect_and_sync_hint') }}
          </p>
        </div>
      </div>
    </section>

    <!-- POS kimliği -->
    <section class="card-panel p-5">
      <h2 class="font-semibold text-paper-800 dark:text-paper-200 mb-4">
        <i class="pi pi-id-card mr-2 text-blue-600" />{{ $t("pos_name") }}
      </h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="field-label field-label-default">{{ $t("pos_name") }}</label>
          <input v-model="form[nameField]" type="text" class="field-input-base field-input-default field-size-md">
        </div>
        <div>
          <label class="field-label field-label-default">{{ $t("fiscal_number") }}</label>
          <input v-model="form.fiscalNumber" type="text" class="field-input-base field-input-default field-size-md">
        </div>

        <div>
          <label class="field-label field-label-default">{{ $t("company_id") }}</label>
          <FormFieldSelect
            v-model.number="form.companyId"
            :options="companyOptions"
            option-label="name"
            option-value="id"
            :placeholder="$t('select_company', 'Şirket Seçin')"
            size="md"
          />
        </div>
        <div>
          <label class="field-label field-label-default">{{ $t("warehouse_id") }}</label>
          <FormFieldSelect
            v-model.number="form.warehouseId"
            :options="warehouseOptions"
            option-label="name"
            option-value="id"
            :placeholder="$t('select_warehouse', 'Depo Seçin')"
            size="md"
          />
        </div>
        <div>
          <label class="field-label field-label-default">{{ $t("default_account_id") }}</label>
          <FormFieldSelect
            v-model.number="form.defaultAccountId"
            :options="accountOptions"
            option-label="name"
            option-value="id"
            :placeholder="$t('select_account', 'Cari Seçin')"
            size="md"
          />
        </div>
      </div>
      <div class="mt-4">
        <button class="btn-base btn-success btn-size-md rounded-lg" :disabled="busy" @click="save">
          <i class="pi pi-save mr-2" />{{ $t("save") }}
        </button>
      </div>
    </section>

    <!-- Mali yazıcı (Tremol FLink) -->
    <section class="card-panel p-5">
      <h2 class="font-semibold text-paper-800 dark:text-paper-200 mb-4">
        <i class="pi pi-print mr-2 text-blue-600" />{{ $t("fiscal_settings") }}
      </h2>
      <div>
        <label class="field-label field-label-default">{{ $t("fiscal_watch_dir") }}</label>
        <input
          v-model="form.fiscalWatchDir"
          type="text"
          class="field-input-base field-input-default field-size-md"
          placeholder="C:\Temp"
        >
        <p class="mt-1 text-xs text-paper-500 dark:text-paper-400">{{ $t("fiscal_watch_dir_hint") }}</p>
      </div>
      <div class="mt-4">
        <button class="btn-base btn-success btn-size-md rounded-lg" :disabled="busy" @click="save">
          <i class="pi pi-save mr-2" />{{ $t("save") }}
        </button>
      </div>
    </section>

    <!-- Ödeme hesapları: Arka (Nakit) tek + Banka (Kart) çoklu — tümü 1000–1049 GL listesinden -->
    <section class="card-panel p-5">
      <h2 class="font-semibold text-paper-800 dark:text-paper-200 mb-4">
        <i class="pi pi-wallet mr-2 text-blue-600" />{{ $t("payment_accounts") }}
      </h2>

      <!-- Arka (Nakit) hesabı — tek seçim -->
      <div class="mb-6">
        <label class="field-label field-label-default">{{ $t("cash_account_arka") }}</label>
        <select v-model.number="form.cashGlAccountId" class="field-input-base field-input-default field-size-md" @change="save">
          <option :value="null" disabled>{{ $t('select_gl_account') }}</option>
          <option v-for="a in bankAccounts" :key="a.id" :value="a.id">{{ a.code }} — {{ a.name }}</option>
        </select>
        <p class="mt-1 text-xs text-paper-500 dark:text-paper-400">{{ $t("cash_account_arka_hint") }}</p>
      </div>

      <!-- Banka (Kart) hesapları — çoklu; ödeme ekranında kart seçeneği olur -->
      <div>
        <label class="field-label field-label-default">{{ $t("bank_card_accounts") }}</label>
        <ul class="divide-y divide-gray-100 dark:divide-gray-800 my-2">
          <li v-for="t in terminalStore.terminals" :key="t.id" class="flex items-center justify-between py-2">
            <span>
              <span class="font-mono text-xs text-paper-500 dark:text-paper-400 mr-2">{{ t.id }}</span>{{ t.name }}
              <span class="badge-base badge-info badge-size-xs ml-1">{{ glAccountLabel(t.glAccountId) }}</span>
            </span>
            <button class="list-btn-delete" @click="removeTerminal(t.id)"><i class="pi pi-trash" /></button>
          </li>
          <li v-if="!terminalStore.terminals.length" class="py-3 text-sm text-paper-500 dark:text-paper-400">—</li>
        </ul>
        <FormFieldAutocomplete
          v-model="bankPick"
          :options="availableBankAccounts"
          option-label="label"
          option-value="id"
          :search-fields="['code', 'name']"
          :placeholder-name="$t('select_account')"
          size="md"
          @select="onSelectBankAccount"
        />
        <p v-if="!bankAccounts.length" class="mt-2 text-xs text-amber-600">
          <i class="pi pi-info-circle mr-1" />{{ $t('gl_accounts_hint') }}
        </p>
        <p v-else class="mt-1 text-xs text-paper-500 dark:text-paper-400">{{ $t("bank_card_accounts_hint") }}</p>
      </div>
    </section>
  </div>
</template>

<script setup>
// settings.vue — Kasa kurulum sayfası: Main bağlantısı + ürün/firma senkronu tek akışta.
// pos + restoran ORTAK (bkz. şablon başındaki yapılandırma notu).
import { formatDateTime as displayDateTime } from "@pro-acc/ui/utils/date";
import { ref, reactive, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const toast = useAppToast();
const { $api } = useNuxtApp();
const appConfig = useAppConfig();
const runtime = useRuntimeConfig();
const settingsStore = useSettingsStore();
const terminalStore = useTerminalStore();

// Uygulamaya özel yapılandırma (varsayılanlar POS davranışıdır)
const titleKey = appConfig.settingsTitleKey || "pos_settings";
const showBack = appConfig.showSettingsBack !== false;
/** Ayar kaydındaki cihaz adı alanı: POS'ta posName, restoranda restaurantName. */
const nameField = runtime.public.terminalNameField || "posName";

const busy = ref(false);
// 'ok' | 'error' | null — son bağlantı denemesinin sonucu (badge için)
const connectionStatus = ref(null);
const form = reactive({
  mainApiUrl: "", syncKey: "", [nameField]: "", fiscalNumber: "", vatNumber: "",
  companyId: 1, warehouseId: 1, defaultAccountId: null, cashGlAccountId: null,
  fiscalWatchDir: "C:\\TEMP",
});
const bankPick = ref(null); // FormFieldAutocomplete seçimi (eklenince sıfırlanır)

// Tarih formatı (son senkron etiketi için)
const fmtDate = (value) => displayDateTime(value, "—");

// Main'den çekilen banka/kasa GL hesapları (kod 1000–1050)
const bankAccounts = ref([]);
async function loadBankAccounts() {
  bankAccounts.value = await $api.sync.glAccounts().catch(() => []);
}
function glAccountLabel(id) {
  const a = bankAccounts.value.find((x) => x.id === id);
  return a ? `${a.code} · ${a.name}` : `GL ${id}`;
}

// Autocomplete seçenekleri: "kod — ad" etiketli 1000–1049 GL hesapları
const bankAccountOptions = computed(() =>
  bankAccounts.value.map((a) => ({ ...a, label: `${a.code} — ${a.name}` })),
);
// Zaten banka(kart) olarak eklenmiş hesapları çıkar (çift eklemeyi önle)
const availableBankAccounts = computed(() =>
  bankAccountOptions.value.filter((a) => !terminalStore.terminals.some((t) => t.glAccountId === a.id)),
);

// Main'den çekilen depolar
const rawWarehouses = ref([]);
async function loadWarehouses() {
  rawWarehouses.value = await $api.sync.warehouses().catch(() => []);
}
const warehouseOptions = computed(() => {
  return rawWarehouses.value
    .filter((w) => w.parentId)
    .map((w) => {
      const parent = rawWarehouses.value.find((p) => p.id === w.parentId);
      return {
        id: w.id,
        name: parent ? `${parent.name} / ${w.name}` : w.name,
      };
    });
});

// Main'den çekilen şirketler
const rawCompanies = ref([]);
async function loadCompanies() {
  rawCompanies.value = await $api.sync.companies().catch(() => []);
}
const companyOptions = computed(() => rawCompanies.value);

// Main'den çekilen cariler
const rawAccounts = ref([]);
async function loadAccounts() {
  rawAccounts.value = await $api.sync.accounts().catch(() => []);
}
const accountOptions = computed(() => rawAccounts.value);

onMounted(async () => {
  const s = await settingsStore.fetch().catch(() => null);
  if (s) Object.assign(form, {
    mainApiUrl: s.mainApiUrl || "", syncKey: s.syncKey || "", [nameField]: s[nameField] || "",
    fiscalNumber: s.fiscalNumber || "", vatNumber: s.vatNumber || "",
    companyId: s.companyId ?? 1, warehouseId: s.warehouseId ?? 1, defaultAccountId: s.defaultAccountId ?? null,
    cashGlAccountId: s.cashGlAccountId ?? null,
    fiscalWatchDir: s.fiscalWatchDir || "C:\\Temp",
  });
  terminalStore.fetch().catch(() => {});
  loadBankAccounts();
  loadWarehouses();
  loadCompanies();
  loadAccounts();
});

async function save() {
  busy.value = true;
  try {
    await settingsStore.save({ ...form });
    toast.success(t("settings_saved"));
  } catch (e) {
    toast.error(e?.data?.statusMessage || t("connection_failed"));
  } finally {
    busy.value = false;
  }
}

/**
 * Tek akış: kaydet → bağlantı test et → firma/depo/cari + ürünleri çek.
 * Başarı/hata badge + toast ile bildirilir.
 */
async function connectAndSync() {
  if (!form.mainApiUrl) return toast.warning(t("main_api_url"));
  busy.value = true;
  connectionStatus.value = null;
  try {
    // 1) Ayarları kaydet (URL/key DB'ye yazılsın)
    await settingsStore.save({ ...form });

    // 2) Bağlantı testi
    const testRes = await $api.sync.test();
    if (!testRes?.ok) {
      connectionStatus.value = "error";
      toast.error(`${t("connection_failed")}${testRes?.error ? `: ${testRes.error}` : ""}`);
      return;
    }
    connectionStatus.value = "ok";

    // 3) Veri çekme: firma adı + depo + cari + ürün kataloğu
    const syncRes = await $api.sync.all();
    await settingsStore.fetch(); // store'u güncelle (lastSync, companyName vb.)
    await loadBankAccounts();   // banka GL hesaplarını tazele
    await loadWarehouses();
    await loadCompanies();
    await loadAccounts();

    toast.success(`${t("data_updated")} · ${t("products_pulled")}: ${syncRes?.products ?? 0}`);
  } catch (e) {
    connectionStatus.value = "error";
    toast.error(e?.data?.statusMessage || t("connection_failed"));
  } finally {
    busy.value = false;
  }
}

/**
 * GL hesabı (1000–1049) autocomplete'ten seçilince banka(kart) hesabı olarak ekler.
 * BankTerminal: id = hesap kodu, name = hesap adı, glAccountId = hesap id'si.
 */
async function onSelectBankAccount(account) {
  if (!account?.id) return;
  try {
    await $api.bankTerminal.createTerminal({
      id: String(account.code),
      name: account.name,
      glAccountId: account.id,
    });
    await terminalStore.fetch();
  } catch (e) {
    toast.error(e?.data?.statusMessage || t("connection_failed"));
  } finally {
    bankPick.value = null; // alanı bir sonraki seçim için temizle
  }
}

async function removeTerminal(id) {
  await $api.bankTerminal.deleteTerminal(id).catch(() => {});
  await terminalStore.fetch();
}
</script>
