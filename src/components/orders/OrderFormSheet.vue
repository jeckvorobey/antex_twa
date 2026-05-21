<template>
  <q-dialog :model-value="modelValue" position="bottom" class="app-dialog--bottom"
    @update:model-value="$emit('update:modelValue', $event)">
    <AppSurface class="app-sheet q-pt-sm q-px-md">
      <div class="app-sheet-handle" />
      <div class="app-sheet__description">{{ t('order.description') }}</div>

      <ExchangeOrderDetails
        v-model:selected-sell-currency="selectedSellCurrency"
        v-model:selected-buy-currency="currencyBuy"
        v-model:amount-sell="amountSell"
        v-model:amount-buy="amountBuy"
        v-model:selected-country="selectedCountry"
        v-model:selected-method="selectedMethod"
        v-model:selected-city-id="selectedCityId"
        :sell-options="sellOptions"
        :buy-options="currencyOptions"
        :rate-label="currentRateLabel"
        :country-options="countryOptions"
        :city-options="cityOptions"
      />

      <AppButton block :loading="exchangeStore.submitting" @click="submit">
        {{ t('common.submit') }}
      </AppButton>
    </AppSurface>
  </q-dialog>
</template>

<script setup lang="ts">
import { Notify } from 'quasar';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import AppButton from '@components/ui/AppButton.vue';
import ExchangeOrderDetails from '@components/orders/ExchangeOrderDetails.vue';
import AppSurface from '@components/ui/AppSurface.vue';
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
  calculateLocalQuote,
  resetCityForMethod,
} from '@utils/exchange';
import { formatReadableNumber } from '@utils/formatters';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const { locale, t } = useI18n();
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
const lastEditedField = ref<'sell' | 'buy'>('sell');
const syncingQuote = ref(false);

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
    .map((country) => ({ label: country.label, value: country.id }))
    .filter((country) => country.value);
});
const cityOptions = computed(() => buildCityOptions(exchangeStore.cities, selectedCountry.value));
const currentQuoteMethods = computed(() => {
  const contextMethods = uiStore.orderContext?.availableMethods;
  if (contextMethods?.length) {
    return contextMethods;
  }

  const quote = exchangeStore.quote;
  if (!quote || quote.currencySell !== selectedSellCurrency.value || quote.currencyBuy !== currencyBuy.value) {
    return null;
  }

  return quote.availableMethods;
});
const currentRateLabel = computed(() => {
  const currentQuote = resolveCurrentQuote();
  if (!currentQuote) {
    return t('exchange.quoteUnavailable');
  }

  return `1 ${currentQuote.currencySell} = ${formatReadableNumber(currentQuote.rate, locale.value)} ${currentQuote.currencyBuy}`;
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

    selectedSellCurrency.value = uiStore.orderContext?.currencySell ?? exchangeStore.quote?.currencySell ?? 'RUB';
    amountSell.value = uiStore.orderContext?.amountSell ?? exchangeStore.quote?.amountSell ?? 5000;
    amountBuy.value = uiStore.orderContext?.amountBuy ?? exchangeStore.quote?.amountBuy ?? null;
    currencyBuy.value = uiStore.orderContext?.currencyBuy ?? exchangeStore.quote?.currencyBuy ?? 'THB';
    selectedCountry.value = uiStore.orderContext?.country
      ?? getCountryByCurrency(exchangeStore.screen?.pairs ?? [], currencyBuy.value);
    selectedCityId.value = uiStore.orderContext?.cityId ?? null;
    selectedMethod.value = getPreferredReceiveMethod(currentQuoteMethods.value, selectedCityId.value);
  },
  { immediate: true },
);

watch(selectedSellCurrency, () => {
  const nextBuyCurrency = currencyOptions.value[0]?.value ?? currencyBuy.value;
  if (!currencyOptions.value.some((option) => option.value === currencyBuy.value)) {
    currencyBuy.value = nextBuyCurrency;
    return;
  }

  if (lastEditedField.value === 'sell') {
    recalculateFromSell();
  } else {
    recalculateFromBuy();
  }
});

watch(currencyOptions, (options) => {
  if (!options.length || options.some((option) => option.value === currencyBuy.value)) {
    return;
  }

  currencyBuy.value = options[0]?.value ?? currencyBuy.value;
});

watch(currencyBuy, (value) => {
  selectedCountry.value = uiStore.orderContext?.country
    ?? getCountryByCurrency(exchangeStore.screen?.pairs ?? [], value);

  if (lastEditedField.value === 'sell') {
    recalculateFromSell();
  } else {
    recalculateFromBuy();
  }
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
  if (syncingQuote.value || value === previousValue) {
    return;
  }

  lastEditedField.value = 'sell';
  recalculateFromSell();
});

watch(amountBuy, (value, previousValue) => {
  if (syncingQuote.value || value === previousValue) {
    return;
  }

  lastEditedField.value = 'buy';
  recalculateFromBuy();
});

function resolveCurrentQuote() {
  return calculateLocalQuote({
    pairs: exchangeStore.screen?.pairs ?? [],
    referenceQuote: exchangeStore.screen?.quote ?? exchangeStore.quote,
    currencySell: selectedSellCurrency.value,
    currencyBuy: currencyBuy.value,
    amountSell: amountSell.value,
    amountBuy: amountBuy.value,
    lastEdited: lastEditedField.value,
  });
}

function recalculateFromSell() {
  syncingQuote.value = true;
  const quote = calculateLocalQuote({
    pairs: exchangeStore.screen?.pairs ?? [],
    referenceQuote: exchangeStore.screen?.quote ?? exchangeStore.quote,
    currencySell: selectedSellCurrency.value,
    currencyBuy: currencyBuy.value,
    amountSell: amountSell.value,
    amountBuy: amountBuy.value,
    lastEdited: 'sell',
  });
  amountSell.value = quote?.amountSell ?? amountSell.value;
  amountBuy.value = quote?.amountBuy ?? amountBuy.value;
  syncingQuote.value = false;
}

function recalculateFromBuy() {
  syncingQuote.value = true;
  const quote = calculateLocalQuote({
    pairs: exchangeStore.screen?.pairs ?? [],
    referenceQuote: exchangeStore.screen?.quote ?? exchangeStore.quote,
    currencySell: selectedSellCurrency.value,
    currencyBuy: currencyBuy.value,
    amountSell: amountSell.value,
    amountBuy: amountBuy.value,
    lastEdited: 'buy',
  });
  amountSell.value = quote?.amountSell ?? amountSell.value;
  amountBuy.value = quote?.amountBuy ?? amountBuy.value;
  syncingQuote.value = false;
}

/**
 * Отправляет miniapp-заявку и показывает локализованное сообщение по коду ошибки.
 */
async function submit() {
  if (!amountSell.value || amountSell.value <= 0) {
    Notify.create({ type: 'warning', message: t('exchange.quoteUnavailable') });
    return;
  }

  if (!selectedCountry.value) {
    Notify.create({ type: 'warning', message: t('errors.generic') });
    return;
  }

  try {
    const order = await exchangeStore.submitOrder({
      country: selectedCountry.value,
      cityId: selectedMethod.value === 'cash' ? selectedCityId.value : null,
      currencySell: selectedSellCurrency.value,
      currencyBuy: currencyBuy.value,
      amountSell: amountSell.value,
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
