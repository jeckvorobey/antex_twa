<template>
  <q-page class="app-page app-page--exchange">
    <div class="app-screen app-screen--exchange fit column no-wrap">
      <q-form class="col column no-wrap" @submit.prevent="submitOrder">
        <div class="app-exchange-content col column q-gutter-md no-wrap">
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
            :internal-exchange="isInternalExchange"
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
          <AppButton
            block
            type="submit"
            :loading="exchangeStore.submitting || submitFlowPending"
            :disable="!canSubmit || submitFlowPending"
          >
            {{ t('common.submit') }}
          </AppButton>
        </div>
      </q-form>
    </div>

    <q-dialog v-model="offlineConfirmVisible" position="bottom">
      <AppSurface class="app-sheet q-pa-md">
        <div class="text-subtitle1">{{ t('order.offlineTitle') }}</div>
        <div class="text-body2 text-grey-5 q-mt-sm">{{ t('order.offlineText') }}</div>
        <div class="text-body2 q-mt-sm">
          {{ exchangeStore.screen?.managerAvailability.businessHoursText }}
        </div>
        <div class="row q-col-gutter-sm q-mt-md">
          <div class="col">
            <AppButton
              block
              :loading="exchangeStore.submitting || submitFlowPending"
              @click="confirmOffline"
            >
              {{ t('order.continue') }}
            </AppButton>
          </div>
          <div class="col">
            <AppButton block variant="secondary" @click="offlineConfirmVisible = false">
              {{ t('order.back') }}
            </AppButton>
          </div>
        </div>
      </AppSurface>
    </q-dialog>
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
import { useAexStore } from '@stores/aex.store';
import { useExchangeStore } from '@stores/exchange.store';
import { useOrdersStore } from '@stores/orders.store';
import type { MiniappQuoteResponse, MiniappRateCard, MiniappReceiveMethod } from '@types/miniapp';
import { getMiniappErrorMessageKey } from '@utils/api-errors';
import { formatMiniappDateTime, formatReadableNumber } from '@utils/formatters';
import {
  buildCityOptions,
  buildCountryOptions,
  buildBuyCurrencyOptions,
  calculateLocalQuote,
  getCountryByCurrency,
  getCurrencyByCountry,
  getPreferredReceiveMethod,
  isTokenCurrency,
  isInternalAexPayout,
  resetCityForMethod,
  TOKEN_CURRENCY,
  validatePreliminaryOrderDraft,
} from '@utils/exchange';

const router = useRouter();
const aexStore = useAexStore();
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
const aexQuote = ref<MiniappQuoteResponse | null>(null);
const offlineConfirmVisible = ref(false);
const offlineConfirmed = ref(false);
const submitFlowPending = ref(false);

const sellOptions = computed(() => {
  const options = [
    ...new Set(
      (exchangeStore.screen?.pairs ?? []).map((pair) => pair.id.split('-')[0]?.toUpperCase()),
    ),
  ].map((currency) => ({
    label: currency,
    value: currency,
  }));

  if (
    aexStore.isAexCurrencyAvailable &&
    !options.some((option) => option.value === TOKEN_CURRENCY)
  ) {
    options.push({ label: t('exchange.aexCurrency'), value: TOKEN_CURRENCY });
  }

  return options;
});

const buyOptions = computed(() => {
  return buildBuyCurrencyOptions(
    exchangeStore.screen?.pairs ?? [],
    selectedSellCurrency.value,
    exchangeStore.screen?.aexPayoutOptions ?? [],
  );
});

const isInternalExchange = computed(() =>
  isInternalAexPayout(selectedSellCurrency.value, selectedBuyCurrency.value),
);

const countryOptions = computed(() => {
  return buildCountryOptions(exchangeStore.screen?.pairs ?? [], selectedSellCurrency.value);
});

const cityOptions = computed(() => buildCityOptions(exchangeStore.cities, selectedCountry.value));

const currentQuoteMethods = computed(() => resolveCurrentQuote()?.availableMethods ?? null);

onMounted(async () => {
  if (!exchangeStore.loaded || !exchangeStore.screen || !exchangeStore.cities.length) {
    await exchangeStore.load();
  } else {
    void exchangeStore.refresh();
  }
  void loadAexCurrencyState();

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

/** Загружает program config и баланс для решения о показе внутреннего токена. */
async function loadAexCurrencyState() {
  try {
    await Promise.all([aexStore.loadReferral(), aexStore.loadWallet()]);
  } catch {
    // Основной RUB/USDT сценарий не должен ломаться из-за token-информера.
  }
}

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

  syncingState.value = true;
  amountSell.value = getDefaultAmountSell(selectedSellCurrency.value);
  const min = getMinAmount(selectedMethod.value, selectedSellCurrency.value);
  if (min > 0 && (!amountSell.value || amountSell.value < min)) {
    amountSell.value = min;
  }
  syncingState.value = false;
  void refreshQuoteForCurrentState();
});

watch(selectedBuyCurrency, (currencyBuy) => {
  if (isInternalAexPayout(selectedSellCurrency.value, currencyBuy)) {
    selectedCountry.value = 'internal';
    selectedMethod.value = 'bank_account';
    selectedCityId.value = null;
    void refreshQuoteForCurrentState();
    return;
  }
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
    aexQuote.value = null;
    return;
  }

  if (isTokenCurrency(selectedSellCurrency.value)) {
    const normalizedAmountSell = Math.round(amountSell.value);
    const quote = calculateLocalQuote({
      pairs: exchangeStore.screen?.pairs ?? [],
      aexPayoutOptions: exchangeStore.screen?.aexPayoutOptions ?? [],
      currencySell: selectedSellCurrency.value,
      currencyBuy: selectedBuyCurrency.value,
      amountSell: normalizedAmountSell,
    });
    aexQuote.value = quote;
    amountBuy.value = quote?.amountBuy ?? null;
    return;
  }

  aexQuote.value = null;
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
  if (isTokenCurrency(currencySell)) {
    return aexStore.aexWithdrawLimit || 100;
  }

  return currencySell === 'USDT' ? 100 : 5000;
}

function resolveCurrentQuote() {
  if (isTokenCurrency(selectedSellCurrency.value)) {
    return aexQuote.value;
  }

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
  let quote = resolveCurrentQuote();
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
    if (!canSubmit.value || !selectedCountry.value) {
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
      currencyBuy: selectedBuyCurrency.value,
      amountSell: Math.round(amountSell.value),
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
    syncingState.value = true;
    amountSell.value =
      exchangeStore.screen?.calculator.amountSell ??
      getDefaultAmountSell(selectedSellCurrency.value);
    amountBuy.value = exchangeStore.screen?.quote.amountBuy ?? null;
    amountSellTouched.value = false;
    syncingState.value = false;
    selectedMethod.value = 'qrcode';
    selectedCityId.value = null;
    offlineConfirmed.value = false;
    await router.push({ name: 'history' });
  } catch (error: unknown) {
    const code = (error as { response?: { data?: { code?: string } } })?.response?.data?.code;
    const status = (error as { response?: { status?: number } })?.response?.status;
    const messageKey = status === 401 ? 'errors.auth' : getMiniappErrorMessageKey(code);
    Notify.create({ type: 'negative', message: t(messageKey) });
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

function confirmOffline() {
  if (exchangeStore.submitting || submitFlowPending.value) return;
  offlineConfirmed.value = true;
  offlineConfirmVisible.value = false;
  void submitOrder();
}
</script>
