<template>
  <q-dialog
    :model-value="modelValue"
    position="bottom"
    persistent
    class="app-dialog--bottom app-dialog--order"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <AppSurface class="app-sheet app-sheet--order q-pt-sm q-px-md">
      <div
        class="app-sheet__header"
        @touchstart.passive="startSheetDrag"
        @touchmove.passive="trackSheetDrag"
        @touchend="finishSheetDrag"
      >
        <div class="app-sheet-handle" />
      </div>

      <div class="app-sheet__scroll">
        <AppWarningNotice>
          {{ t('order.rateNotice') }}
        </AppWarningNotice>

        <AppWarningNotice v-if="isManagersOffline">
          {{ t('order.offlineInlineNotice') }}
        </AppWarningNotice>

        <ExchangeOrderDetails
          ref="orderDetailsRef"
          v-model:selected-sell-currency="selectedSellCurrency"
          v-model:selected-buy-currency="currencyBuy"
          v-model:amount-sell="amountSell"
          :amount-buy="amountBuy"
          v-model:selected-country="selectedCountry"
          v-model:selected-method="selectedMethod"
          v-model:selected-city-id="selectedCityId"
          :sell-options="sellOptions"
          :buy-options="currencyOptions"
          :rate-label="currentRateLabel"
          :country-options="countryOptions"
          :city-options="cityOptions"
          :available-methods="currentQuoteMethods"
        />
      </div>

      <AppButton
        block
        class="q-mt-md q-mb-md"
        :loading="exchangeStore.submitting || submitFlowPending"
        :disable="!canSubmit || submitFlowPending"
        @click="submit"
      >
        {{ t('common.submit') }}
      </AppButton>
    </AppSurface>
  </q-dialog>

  <q-dialog v-model="offlineConfirmVisible" position="bottom" persistent>
    <AppSurface class="app-sheet app-sheet--confirm q-pa-md">
      <div class="text-subtitle1">{{ t('order.offlineTitle') }}</div>
      <div class="text-body2 text-grey-5 q-mt-sm">{{ t('order.offlineText') }}</div>
      <div class="text-body2 q-mt-sm">
        {{ exchangeStore.screen?.managerAvailability.businessHoursText }}
      </div>
      <div class="row q-col-gutter-sm q-mt-lg">
        <div class="col-12 col-sm">
          <AppButton
            block
            :loading="exchangeStore.submitting || submitFlowPending"
            @click="confirmOffline"
            >{{ t('common.yes') }}</AppButton
          >
        </div>
        <div class="col-12 col-sm">
          <AppButton block variant="secondary" @click="cancelOffline">{{
            t('common.cancel')
          }}</AppButton>
        </div>
      </div>
    </AppSurface>
  </q-dialog>
</template>

<script setup lang="ts">
import { Notify } from 'quasar';
import { computed, nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import AppButton from '@components/ui/AppButton.vue';
import ExchangeOrderDetails from '@components/orders/ExchangeOrderDetails.vue';
import AppSurface from '@components/ui/AppSurface.vue';
import AppWarningNotice from '@components/ui/AppWarningNotice.vue';
import { useExchangeStore } from '@stores/exchange.store';
import { useHomeStore } from '@stores/home.store';
import { useOrdersStore } from '@stores/orders.store';
import { useUiStore } from '@stores/ui.store';
import type { MiniappReceiveMethod } from '@types/miniapp';
import { getMinAmount } from '@constants/limits';
import { getMiniappErrorMessageKey } from '@utils/api-errors';
import {
  buildCityOptions,
  buildCountryOptions,
  buildBuyCurrencyOptions,
  getCountryByCurrency,
  getCurrencyByCountry,
  getPreferredReceiveMethod,
  resetCityForMethod,
  validatePreliminaryOrderDraft,
} from '@utils/exchange';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const { t } = useI18n();
const router = useRouter();
const exchangeStore = useExchangeStore();
const homeStore = useHomeStore();
const ordersStore = useOrdersStore();
const uiStore = useUiStore();

const amountSell = ref<number | null>(null);
const amountBuy = ref<number | null>(null);
const selectedSellCurrency = ref<string>('RUB');
const currencyBuy = ref<string>('THB');
const selectedCountry = ref<string | null>(null);
const selectedMethod = ref<MiniappReceiveMethod>('qrcode');
const selectedCityId = ref<number | null>(null);
const amountSellTouched = ref(false);
const syncingState = ref(false);
const shouldFocusAmountSellAfterOpen = ref(false);
const offlineConfirmVisible = ref(false);
const offlineConfirmed = ref(false);
const submitFlowPending = ref(false);
const orderDetailsRef = ref<{ focusAmountSell: () => void } | null>(null);
const sheetDragStartY = ref<number | null>(null);
const sheetDragDeltaY = ref(0);

const sellOptions = computed(() =>
  [
    ...new Set(
      (exchangeStore.screen?.pairs ?? []).map((pair) => pair.id.split('-')[0]?.toUpperCase()),
    ),
  ].map((currency) => ({
    label: currency,
    value: currency,
  })),
);
const currencyOptions = computed(() => {
  const options = buildBuyCurrencyOptions(
    exchangeStore.screen?.pairs ?? [],
    selectedSellCurrency.value,
  );
  const contextBuyCurrency = uiStore.orderContext?.currencyBuy;
  if (options.length || !contextBuyCurrency) {
    return options;
  }

  return [{ label: contextBuyCurrency, value: contextBuyCurrency }];
});
const countryOptions = computed(() => {
  const exchangePairs = exchangeStore.screen?.pairs ?? [];
  const options = buildCountryOptions(exchangePairs, selectedSellCurrency.value);
  if (options.length) {
    return options;
  }

  return (homeStore.data?.countries ?? [])
    .map((country) => ({ label: country.label, value: country.id, mark: country.flag }))
    .filter((country) => country.value);
});
const cityOptions = computed(() => buildCityOptions(exchangeStore.cities, selectedCountry.value));
const currentQuoteMethods = computed(() => {
  const quote = exchangeStore.quote;
  if (
    quote &&
    quote.currencySell === selectedSellCurrency.value &&
    quote.currencyBuy === currencyBuy.value
  ) {
    return quote.availableMethods;
  }

  return uiStore.orderContext?.availableMethods ?? null;
});
const currentRateLabel = computed(() => {
  const currentQuote = resolveCurrentQuote();
  if (!currentQuote) {
    return t('exchange.quoteUnavailable');
  }

  return currentQuote.rateText;
});
const isManagersOffline = computed(
  () => exchangeStore.screen?.managerAvailability.status === 'offline',
);

const preliminaryValidation = computed(() =>
  validatePreliminaryOrderDraft({
    pairs: exchangeStore.screen?.pairs ?? [],
    cities: exchangeStore.cities,
    currencySell: selectedSellCurrency.value,
    currencyBuy: currencyBuy.value,
    amountSell: amountSell.value,
    selectedCountry: selectedCountry.value,
    selectedMethod: selectedMethod.value,
    selectedCityId: selectedCityId.value,
  }),
);
const canSubmit = computed(() => {
  const hasAmounts = Boolean(
    amountSell.value && amountSell.value > 0 && amountBuy.value && amountBuy.value > 0,
  );
  const hasBaseFields = Boolean(selectedSellCurrency.value && currencyBuy.value);
  const hasMethodFields = selectedMethod.value !== 'cash' || Boolean(selectedCityId.value);

  return hasAmounts && hasBaseFields && hasMethodFields && preliminaryValidation.value.valid;
});

watch(
  () => props.modelValue,
  async (opened) => {
    if (!opened) {
      offlineConfirmed.value = false;
      offlineConfirmVisible.value = false;
      resetSheetDrag();
      return;
    }

    if (!exchangeStore.screen || !exchangeStore.cities.length) {
      await exchangeStore.load();
    }

    shouldFocusAmountSellAfterOpen.value = Boolean(uiStore.orderContext);
    syncingState.value = true;
    resetFormToDefaults();
    syncingState.value = false;
    refreshQuoteForCurrentState();
    if (shouldFocusAmountSellAfterOpen.value) {
      await nextTick();
      orderDetailsRef.value?.focusAmountSell();
      shouldFocusAmountSellAfterOpen.value = false;
    }
  },
  { immediate: true },
);

watch(selectedSellCurrency, () => {
  const nextBuyCurrency = currencyOptions.value[0]?.value ?? currencyBuy.value;
  if (!currencyOptions.value.some((option) => option.value === currencyBuy.value)) {
    currencyBuy.value = nextBuyCurrency;
  }

  syncingState.value = true;
  amountSell.value = getDefaultAmountSell(selectedSellCurrency.value);
  const min = getMinAmount(selectedMethod.value, selectedSellCurrency.value);
  if (min > 0 && (!amountSell.value || amountSell.value < min)) {
    amountSell.value = min;
  }
  syncingState.value = false;
  void refreshQuoteForCurrentState();
});

watch(currencyOptions, (options) => {
  if (!options.length || options.some((option) => option.value === currencyBuy.value)) {
    return;
  }

  currencyBuy.value = options[0]?.value ?? currencyBuy.value;
});

watch(currencyBuy, (value) => {
  selectedCountry.value = getCountryByCurrency(exchangeStore.screen?.pairs ?? [], value);

  void refreshQuoteForCurrentState();
});

watch(selectedCountry, (country) => {
  const nextCurrency = getCurrencyByCountry(exchangeStore.screen?.pairs ?? [], country ?? '');
  if (nextCurrency && nextCurrency !== currencyBuy.value) {
    currencyBuy.value = nextCurrency;
    return;
  }

  if (selectedMethod.value !== 'cash') {
    return;
  }

  selectedCityId.value = cityOptions.value[0]?.value ?? null;
});

watch(selectedMethod, (method) => {
  selectedCityId.value = resetCityForMethod(method, selectedCityId.value);
});

watch(cityOptions, (options) => {
  if (!options.length) {
    if (selectedMethod.value === 'cash') {
      selectedMethod.value = 'qrcode';
    }
    selectedCityId.value = null;
    return;
  }

  if (selectedMethod.value !== 'cash') {
    return;
  }

  if (!options.some((option) => option.value === selectedCityId.value)) {
    selectedCityId.value = options[0]?.value ?? null;
  }
});

watch(currentQuoteMethods, (availableMethods) => {
  if (availableMethods?.includes(selectedMethod.value)) {
    return;
  }

  selectedMethod.value = getPreferredReceiveMethod(availableMethods, selectedCityId.value);
});

watch(amountSell, (value, previousValue) => {
  if (syncingState.value || value === previousValue) {
    return;
  }

  amountSellTouched.value = true;
  void refreshQuoteForCurrentState();
});

function resolveCurrentQuote() {
  const quote = exchangeStore.quote;
  if (
    !quote ||
    quote.currencySell !== selectedSellCurrency.value ||
    quote.currencyBuy !== currencyBuy.value
  ) {
    return null;
  }

  return quote;
}

function refreshQuoteForCurrentState() {
  if (!amountSell.value || amountSell.value <= 0) {
    amountBuy.value = null;
    return;
  }

  const quote = exchangeStore.recalculateQuote({
    currencySell: selectedSellCurrency.value,
    currencyBuy: currencyBuy.value,
    amountSell: Math.round(amountSell.value),
  });

  if (!quote) {
    amountBuy.value = null;
    return;
  }

  syncingState.value = true;
  selectedSellCurrency.value = quote.currencySell;
  currencyBuy.value = quote.currencyBuy;
  amountSell.value = quote.amountSell;
  amountBuy.value = quote.amountBuy;
  syncingState.value = false;
}

function getDefaultAmountSell(currencySell: string) {
  return currencySell === 'USDT' ? 100 : 5000;
}

/** Возвращает форму к начальному состоянию с учётом контекста повторной заявки. */
function resetFormToDefaults() {
  selectedSellCurrency.value =
    uiStore.orderContext?.currencySell ?? exchangeStore.quote?.currencySell ?? 'RUB';
  amountSell.value =
    uiStore.orderContext?.amountSell ??
    exchangeStore.quote?.amountSell ??
    getDefaultAmountSell(selectedSellCurrency.value);
  amountBuy.value = null;
  currencyBuy.value =
    uiStore.orderContext?.currencyBuy ?? exchangeStore.quote?.currencyBuy ?? 'THB';
  selectedCountry.value =
    uiStore.orderContext?.country ??
    getCountryByCurrency(exchangeStore.screen?.pairs ?? [], currencyBuy.value);
  selectedCityId.value = uiStore.orderContext?.cityId ?? null;
  selectedMethod.value = getPreferredReceiveMethod(currentQuoteMethods.value, selectedCityId.value);
  amountSellTouched.value = Boolean(uiStore.orderContext?.amountSell);
}

/**
 * Отправляет miniapp-заявку и показывает локализованное сообщение по коду ошибки.
 */
async function submit() {
  let quote = resolveCurrentQuote();
  if (!amountSell.value || amountSell.value <= 0 || !amountBuy.value || !quote) {
    Notify.create({ type: 'negative', message: t('exchange.quoteUnavailable') });
    return;
  }

  const validation = preliminaryValidation.value;
  if (!validation.valid) {
    Notify.create({ type: 'negative', message: t(validation.messageKey, validation.params) });
    return;
  }

  if (!selectedCountry.value) {
    return;
  }

  if (submitFlowPending.value) {
    return;
  }
  submitFlowPending.value = true;

  try {
    if ((await shouldConfirmOfflineSubmit()) && !offlineConfirmed.value) {
      offlineConfirmVisible.value = true;
      return;
    }
    const refreshedValidation = preliminaryValidation.value;
    if (!refreshedValidation.valid) {
      Notify.create({
        type: 'negative',
        message: t(refreshedValidation.messageKey, refreshedValidation.params),
      });
      return;
    }
    if (!selectedCountry.value) {
      return;
    }
    quote = resolveCurrentQuote();
    if (!quote || !amountBuy.value) {
      Notify.create({ type: 'negative', message: t('exchange.quoteUnavailable') });
      return;
    }

    const order = await exchangeStore.submitOrder({
      country: selectedCountry.value,
      cityId: selectedMethod.value === 'cash' ? selectedCityId.value : null,
      currencySell: selectedSellCurrency.value,
      currencyBuy: currencyBuy.value,
      amountSell: amountSell.value,
      amountBuy: amountBuy.value,
      rate: quote.rate,
      methodGet: selectedMethod.value,
    });

    ordersStore.prepend(order);
    Notify.create({
      type: 'positive',
      message:
        order.managerAvailability?.status === 'offline'
          ? t('order.successOffline')
          : t('order.success'),
    });
    emit('update:modelValue', false);
    await router.push({ name: 'history' });
  } catch (error: unknown) {
    const data = (
      error as { response?: { data?: { code?: string; params?: Record<string, unknown> } } }
    )?.response?.data;
    const code = data?.code;
    const params = data?.params ?? {};
    const messageKey = getMiniappErrorMessageKey(code);
    const message =
      code === 'MIN_AMOUNT'
        ? t(messageKey, { amount: params.minAmount, currency: params.currency })
        : t(messageKey);
    Notify.create({ type: 'negative', message });
  } finally {
    submitFlowPending.value = false;
  }
}

async function shouldConfirmOfflineSubmit() {
  try {
    await exchangeStore.refresh();
    refreshQuoteForCurrentState();
  } catch {
    return exchangeStore.screen?.managerAvailability.status === 'offline';
  }
  return exchangeStore.screen?.managerAvailability.status === 'offline';
}

/** Подтверждает один оффлайн-сценарий в пределах открытой формы. */
function confirmOffline() {
  if (exchangeStore.submitting || submitFlowPending.value) return;
  offlineConfirmed.value = true;
  offlineConfirmVisible.value = false;
  void submit();
}

/** Отменяет off-hours оформление и сбрасывает форму без закрытия sheet. */
function cancelOffline() {
  offlineConfirmed.value = false;
  offlineConfirmVisible.value = false;
  syncingState.value = true;
  resetFormToDefaults();
  syncingState.value = false;
  refreshQuoteForCurrentState();
}

/** Запоминает начальную точку drag-down жеста закрытия нижнего sheet. */
function startSheetDrag(event: TouchEvent) {
  sheetDragStartY.value = event.touches[0]?.clientY ?? null;
  sheetDragDeltaY.value = 0;
}

/** Отслеживает только движение вниз; внешний tap не влияет на состояние dialog. */
function trackSheetDrag(event: TouchEvent) {
  if (sheetDragStartY.value === null) {
    return;
  }
  sheetDragDeltaY.value = Math.max(
    0,
    (event.touches[0]?.clientY ?? sheetDragStartY.value) - sheetDragStartY.value,
  );
}

/** Закрывает sheet, если пользователь явно потянул его вниз. */
function finishSheetDrag() {
  if (sheetDragDeltaY.value > 80) {
    emit('update:modelValue', false);
  }
  resetSheetDrag();
}

/** Сбрасывает временное состояние drag-жеста. */
function resetSheetDrag() {
  sheetDragStartY.value = null;
  sheetDragDeltaY.value = 0;
}
</script>
