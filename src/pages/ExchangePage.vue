<template>
  <q-page class="app-page app-page--exchange">
    <div class="app-screen app-screen--exchange fit column no-wrap">
      <q-form class="col column no-wrap" @submit.prevent="submitOrder">
        <div class="app-exchange-content col column q-gutter-md no-wrap overflow-hidden">
          <AppWarningNotice>
            {{ t('order.rateNotice') }}
          </AppWarningNotice>

          <ExchangeOrderDetails
            v-model:selected-sell-currency="selectedSellCurrency"
            v-model:selected-buy-currency="selectedBuyCurrency"
            v-model:amount-sell="amountSell"
            :amount-buy="amountBuy"
            v-model:selected-country="selectedCountry"
            v-model:selected-method="selectedMethod"
            v-model:selected-city-id="selectedCityId"
            :sell-options="sellOptions"
            :buy-options="buyOptions"
            :rate-label="currentRateLabel"
            :country-options="countryOptions"
            :city-options="cityOptions"
            :available-methods="currentQuoteMethods"
          />

          <section class="app-section">
            <AppSectionTitle>{{ t('exchange.availablePairs') }}</AppSectionTitle>

            <div class="app-exchange-pairs app-exchange-pairs--carousel">
              <AppSurface
                v-for="pair in exchangeStore.screen?.pairs ?? []"
                :key="pair.id"
                class="app-exchange-pair-card"
              >
                <div class="app-exchange-pair-card__pair">
                  <span>{{ pair.fromCurrency }}</span>
                  <q-icon name="arrow_forward" size="14px" />
                  <span>{{ pair.toCurrency }}</span>
                </div>

                <AppRateValue :value="pair.rateDisplay" />

                <div class="app-exchange-pair-card__meta">
                  {{ formatMiniappDateTime(pair.updatedAt, locale) }}
                </div>

                <AppButton block class="app-exchange-pair-card__button" @click="selectPair(pair)">
                  {{ t('common.exchange') }}
                </AppButton>
              </AppSurface>
            </div>
          </section>
        </div>

        <div class="q-pt-md app-exchange-submit">
          <AppButton block type="submit" :loading="exchangeStore.submitting" :disable="!canSubmit">
            {{ t('common.submit') }}
          </AppButton>
        </div>
      </q-form>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { Notify } from 'quasar';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import ExchangeOrderDetails from '@components/orders/ExchangeOrderDetails.vue';
import AppButton from '@components/ui/AppButton.vue';
import AppRateValue from '@components/ui/AppRateValue.vue';
import AppSectionTitle from '@components/ui/AppSectionTitle.vue';
import AppSurface from '@components/ui/AppSurface.vue';
import AppWarningNotice from '@components/ui/AppWarningNotice.vue';
import { getMinAmount } from '@constants/limits';
import { useExchangeStore } from '@stores/exchange.store';
import { useOrdersStore } from '@stores/orders.store';
import type { MiniappRateCard, MiniappReceiveMethod } from '@types/miniapp';
import { getMiniappErrorMessageKey } from '@utils/api-errors';
import { formatMiniappDateTime, formatReadableNumber } from '@utils/formatters';
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

const router = useRouter();
const exchangeStore = useExchangeStore();
const ordersStore = useOrdersStore();
const { locale, t } = useI18n();

const selectedSellCurrency = ref('RUB');
const selectedBuyCurrency = ref('THB');
const amountSell = ref<number | null>(5000);
const amountBuy = ref<number | null>(null);
const selectedCountry = ref<string | null>(null);
const selectedMethod = ref<MiniappReceiveMethod>('qrcode');
const selectedCityId = ref<number | null>(null);
const amountSellTouched = ref(false);
const syncingState = ref(false);

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

const buyOptions = computed(() =>
  buildBuyCurrencyOptions(exchangeStore.screen?.pairs ?? [], selectedSellCurrency.value),
);

const countryOptions = computed(() =>
  buildCountryOptions(exchangeStore.screen?.pairs ?? [], selectedSellCurrency.value),
);

const cityOptions = computed(() => buildCityOptions(exchangeStore.cities, selectedCountry.value));

const currentQuoteMethods = computed(() => resolveCurrentQuote()?.availableMethods ?? null);

onMounted(async () => {
  if (!exchangeStore.loaded || !exchangeStore.screen || !exchangeStore.cities.length) {
    await exchangeStore.load();
  } else {
    void exchangeStore.refresh();
  }

  syncingState.value = true;
  selectedSellCurrency.value = exchangeStore.screen?.calculator.fromCurrency ?? 'RUB';
  selectedBuyCurrency.value = exchangeStore.screen?.calculator.toCurrency ?? 'THB';
  amountSell.value =
    exchangeStore.screen?.calculator.amountSell ?? getDefaultAmountSell(selectedSellCurrency.value);

  const min = getMinAmount(selectedMethod.value, selectedSellCurrency.value);
  if (min > 0 && (!amountSell.value || amountSell.value < min)) {
    amountSell.value = min;
  }

  selectedCountry.value = getCountryByCurrency(
    exchangeStore.screen?.pairs ?? [],
    selectedBuyCurrency.value,
  );
  amountBuy.value = exchangeStore.quote?.amountBuy ?? null;
  syncingState.value = false;
});

const currentRateLabel = computed(() => {
  const quote = resolveCurrentQuote();
  if (!quote) {
    return t('exchange.quoteUnavailable');
  }

  return (
    quote.rateText ||
    `1 ${quote.currencySell} = ${formatReadableNumber(quote.rate, locale.value)} ${quote.currencyBuy}`
  );
});

const preliminaryValidation = computed(() =>
  validatePreliminaryOrderDraft({
    pairs: exchangeStore.screen?.pairs ?? [],
    cities: exchangeStore.cities,
    currencySell: selectedSellCurrency.value,
    currencyBuy: selectedBuyCurrency.value,
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
  const hasBaseFields = Boolean(selectedSellCurrency.value && selectedBuyCurrency.value);
  const hasMethodFields = selectedMethod.value !== 'cash' || Boolean(selectedCityId.value);
  return hasAmounts && hasBaseFields && hasMethodFields && preliminaryValidation.value.valid;
});

watch(selectedSellCurrency, () => {
  const nextBuyCurrency = buyOptions.value[0]?.value ?? selectedBuyCurrency.value;
  if (!buyOptions.value.some((option) => option.value === selectedBuyCurrency.value)) {
    selectedBuyCurrency.value = nextBuyCurrency;
  }

  if (!amountSellTouched.value || !amountSell.value) {
    syncingState.value = true;
    amountSell.value = getDefaultAmountSell(selectedSellCurrency.value);
    const min = getMinAmount(selectedMethod.value, selectedSellCurrency.value);
    if (min > 0 && (!amountSell.value || amountSell.value < min)) {
      amountSell.value = min;
    }
    syncingState.value = false;
  }
  void refreshQuoteForCurrentState();
});

watch(selectedBuyCurrency, (currencyBuy) => {
  selectedCountry.value = getCountryByCurrency(exchangeStore.screen?.pairs ?? [], currencyBuy);
  void refreshQuoteForCurrentState();
});

watch(selectedMethod, (method) => {
  selectedCityId.value = resetCityForMethod(method, selectedCityId.value);
});

watch(selectedCountry, () => {
  const nextCurrency = getCurrencyByCountry(
    exchangeStore.screen?.pairs ?? [],
    selectedCountry.value ?? '',
  );
  if (nextCurrency && nextCurrency !== selectedBuyCurrency.value) {
    selectedBuyCurrency.value = nextCurrency;
    return;
  }

  if (selectedMethod.value !== 'cash') {
    return;
  }
  selectedCityId.value = cityOptions.value[0]?.value ?? null;
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
    selectedCityId.value = options[0].value;
  }
});

watch(
  () => currentQuoteMethods.value,
  (availableMethods) => {
    if (availableMethods?.includes(selectedMethod.value)) {
      return;
    }

    selectedMethod.value = getPreferredReceiveMethod(availableMethods, selectedCityId.value);
  },
);

watch(amountSell, (value, previousValue) => {
  if (syncingState.value || value === previousValue) {
    return;
  }

  amountSellTouched.value = true;
  void refreshQuoteForCurrentState();
});

function selectPair(pair: MiniappRateCard) {
  const [currencySell, currencyBuy] = pair.id.split('-').map((part) => part.toUpperCase());
  selectedSellCurrency.value = currencySell;
  selectedBuyCurrency.value = currencyBuy;
  selectedCountry.value = pair.country;
  if (!amountSellTouched.value || !amountSell.value) {
    syncingState.value = true;
    amountSell.value = pair.amountSellExample;
    syncingState.value = false;
  }
  void refreshQuoteForCurrentState();
}

function refreshQuoteForCurrentState() {
  if (!amountSell.value || amountSell.value <= 0) {
    amountBuy.value = null;
    return;
  }

  const quote = exchangeStore.recalculateQuote({
    currencySell: selectedSellCurrency.value,
    currencyBuy: selectedBuyCurrency.value,
    amountSell: Math.round(amountSell.value),
  });

  if (!quote) {
    amountBuy.value = null;
    return;
  }

  syncingState.value = true;
  selectedSellCurrency.value = quote.currencySell;
  selectedBuyCurrency.value = quote.currencyBuy;
  amountSell.value = quote.amountSell;
  amountBuy.value = quote.amountBuy;
  syncingState.value = false;
}

function getDefaultAmountSell(currencySell: string) {
  return currencySell === 'USDT' ? 100 : 5000;
}

function resolveCurrentQuote() {
  const quote = exchangeStore.quote;
  if (
    !quote ||
    quote.currencySell !== selectedSellCurrency.value ||
    quote.currencyBuy !== selectedBuyCurrency.value
  ) {
    return null;
  }

  return quote;
}

async function submitOrder() {
  const quote = resolveCurrentQuote();
  if (!amountSell.value || !amountBuy.value || !quote) {
    return;
  }

  const validation = preliminaryValidation.value;
  if (!validation.valid) {
    Notify.create({ type: 'negative', message: t(validation.messageKey, validation.params) });
    return;
  }

  if (!canSubmit.value || !selectedCountry.value) {
    return;
  }

  try {
    const order = await exchangeStore.submitOrder({
      country: selectedCountry.value,
      cityId: selectedMethod.value === 'cash' ? selectedCityId.value : null,
      currencySell: selectedSellCurrency.value,
      currencyBuy: selectedBuyCurrency.value,
      amountSell: Math.round(amountSell.value),
      amountBuy: amountBuy.value,
      rate: quote.rate,
      methodGet: selectedMethod.value,
    });

    ordersStore.prepend(order);
    syncingState.value = true;
    amountSell.value =
      exchangeStore.screen?.calculator.amountSell ??
      getDefaultAmountSell(selectedSellCurrency.value);
    amountBuy.value = exchangeStore.screen?.quote.amountBuy ?? null;
    amountSellTouched.value = false;
    syncingState.value = false;
    selectedMethod.value = 'qrcode';
    selectedCityId.value = null;
    await router.push({ name: 'history' });
  } catch (error: unknown) {
    const code = (error as { response?: { data?: { code?: string } } })?.response?.data?.code;
    const status = (error as { response?: { status?: number } })?.response?.status;
    const messageKey = status === 401 ? 'errors.auth' : getMiniappErrorMessageKey(code);
    Notify.create({ type: 'negative', message: t(messageKey) });
  }
}
</script>
