<template>
  <q-dialog :model-value="modelValue" position="bottom" class="app-dialog--bottom app-dialog--order"
    @update:model-value="$emit('update:modelValue', $event)">
    <AppSurface class="app-sheet q-pt-sm q-px-md">
      <div class="app-sheet-handle" />
      <AppWarningNotice>
        {{ t('order.rateNotice') }}
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
      />

      <AppButton block :loading="exchangeStore.submitting" :disable="!canSubmit" @click="submit">
        {{ t('common.submit') }}
      </AppButton>
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
const selectedMethod = ref<'qrcode' | 'cash'>('qrcode');
const selectedCityId = ref<number | null>(null);
const amountSellTouched = ref(false);
const syncingState = ref(false);
const shouldFocusAmountSellAfterOpen = ref(false);
const orderDetailsRef = ref<{ focusAmountSell: () => void } | null>(null);

const sellOptions = computed(() =>
  [...new Set((exchangeStore.screen?.pairs ?? []).map((pair) => pair.id.split('-')[0]?.toUpperCase()))].map((currency) => ({
    label: currency,
    value: currency,
  })),
);
const currencyOptions = computed(() => {
  const options = buildBuyCurrencyOptions(exchangeStore.screen?.pairs ?? [], selectedSellCurrency.value);
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
  if (quote && quote.currencySell === selectedSellCurrency.value && quote.currencyBuy === currencyBuy.value) {
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

const preliminaryValidation = computed(() => validatePreliminaryOrderDraft({
  pairs: exchangeStore.screen?.pairs ?? [],
  cities: exchangeStore.cities,
  currencySell: selectedSellCurrency.value,
  currencyBuy: currencyBuy.value,
  amountSell: amountSell.value,
  selectedCountry: selectedCountry.value,
  selectedMethod: selectedMethod.value,
  selectedCityId: selectedCityId.value,
}));
const canSubmit = computed(() => {
  const hasAmounts = Boolean(amountSell.value && amountSell.value > 0 && amountBuy.value && amountBuy.value > 0);
  const hasBaseFields = Boolean(selectedSellCurrency.value && currencyBuy.value);
  const hasMethodFields = selectedMethod.value === 'qrcode' || Boolean(selectedCityId.value);

  return hasAmounts && hasBaseFields && hasMethodFields && preliminaryValidation.value.valid;
});

watch(
  () => props.modelValue,
  async (opened) => {
    if (!opened) {
      return;
    }

    if (!exchangeStore.screen || !exchangeStore.cities.length) {
      await exchangeStore.load();
    }

    shouldFocusAmountSellAfterOpen.value = Boolean(uiStore.orderContext);
    syncingState.value = true;
    selectedSellCurrency.value = uiStore.orderContext?.currencySell ?? exchangeStore.quote?.currencySell ?? 'RUB';
    amountSell.value = uiStore.orderContext?.amountSell ?? exchangeStore.quote?.amountSell ?? getDefaultAmountSell(selectedSellCurrency.value);
    amountBuy.value = null;
    currencyBuy.value = uiStore.orderContext?.currencyBuy ?? exchangeStore.quote?.currencyBuy ?? 'THB';
    selectedCountry.value = uiStore.orderContext?.country
      ?? getCountryByCurrency(exchangeStore.screen?.pairs ?? [], currencyBuy.value);
    selectedCityId.value = uiStore.orderContext?.cityId ?? null;
    selectedMethod.value = getPreferredReceiveMethod(currentQuoteMethods.value, selectedCityId.value);
    amountSellTouched.value = Boolean(uiStore.orderContext?.amountSell);
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

  if (!amountSellTouched.value || !amountSell.value) {
    syncingState.value = true;
    amountSell.value = getDefaultAmountSell(selectedSellCurrency.value);
    syncingState.value = false;
  }
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
    selectedMethod.value = 'qrcode';
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
  if (!quote || quote.currencySell !== selectedSellCurrency.value || quote.currencyBuy !== currencyBuy.value) {
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

/**
 * Отправляет miniapp-заявку и показывает локализованное сообщение по коду ошибки.
 */
async function submit() {
  const quote = resolveCurrentQuote();
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

  try {
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
    Notify.create({ type: 'positive', message: t('order.success') });
    emit('update:modelValue', false);
    await router.push({ name: 'history' });
  } catch (error: unknown) {
    const code = (error as { response?: { data?: { code?: string } } })?.response?.data?.code;
    Notify.create({ type: 'negative', message: t(getMiniappErrorMessageKey(code)) });
  }
}
</script>
