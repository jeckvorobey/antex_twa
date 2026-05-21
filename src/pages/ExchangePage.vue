<template>
  <q-page class="app-page app-page--exchange">
    <div class="app-screen app-screen--exchange fit column no-wrap">
      <q-form class="col column no-wrap" @submit.prevent="submitOrder">
        <div class="col column q-gutter-md no-wrap overflow-auto">
          <ExchangeOrderDetails
            v-model:selected-sell-currency="selectedSellCurrency"
            v-model:selected-buy-currency="selectedBuyCurrency"
            v-model:amount-sell="amountSell"
            v-model:amount-buy="amountBuy"
            v-model:selected-country="selectedCountry"
            v-model:selected-method="selectedMethod"
            v-model:selected-city-id="selectedCityId"
            :sell-options="sellOptions"
            :buy-options="buyOptions"
            :rate-label="currentRateLabel"
            :country-options="countryOptions"
            :city-options="cityOptions"
          />

          <AppSurface v-if="!authStore.trustedContactReady" class="q-pa-md">
            <div class="app-order-sheet__fields">
              <div class="app-order-sheet__field">
                <div class="app-order-sheet__label">{{ t('exchange.trustedPhone') }}</div>
                <div class="app-order-sheet__control">
                  <q-input
                    v-model.trim="contactPhone"
                    class="app-order-sheet__input"
                    type="tel"
                    borderless
                    dense
                    :placeholder="t('exchange.trustedPhonePlaceholder')"
                  />
                </div>
              </div>
            </div>
          </AppSurface>

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
            :loading="exchangeStore.submitting || authStore.phoneSaving"
            :disable="!canSubmit"
          >
            {{ t('common.submit') }}
          </AppButton>
        </div>
      </q-form>

      <q-inner-loading :showing="exchangeStore.loading" dark />
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
import { useAuthStore } from '@stores/auth.store';
import { useExchangeStore } from '@stores/exchange.store';
import { useOrdersStore } from '@stores/orders.store';
import type { MiniappRateCard } from '@types/miniapp';
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
} from '@utils/exchange';

const router = useRouter();
const authStore = useAuthStore();
const exchangeStore = useExchangeStore();
const ordersStore = useOrdersStore();
const { locale, t } = useI18n();

const selectedSellCurrency = ref('RUB');
const selectedBuyCurrency = ref('THB');
const amountSell = ref<number | null>(5000);
const amountBuy = ref<number | null>(null);
const selectedCountry = ref<string | null>(null);
const selectedMethod = ref<'qrcode' | 'cash'>('qrcode');
const selectedCityId = ref<number | null>(null);
const contactPhone = ref('');
const lastEditedField = ref<'sell' | 'buy'>('sell');
const syncingQuote = ref(false);

const sellOptions = computed(() =>
  [...new Set((exchangeStore.screen?.pairs ?? []).map((pair) => pair.id.split('-')[0]?.toUpperCase()))].map((currency) => ({
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

const cityOptions = computed(() =>
  buildCityOptions(exchangeStore.cities, selectedCountry.value),
);

onMounted(async () => {
  if (!exchangeStore.screen) {
    await exchangeStore.load();
  }

  selectedSellCurrency.value = exchangeStore.screen?.calculator.fromCurrency ?? 'RUB';
  selectedBuyCurrency.value = exchangeStore.screen?.calculator.toCurrency ?? 'THB';
  amountSell.value = exchangeStore.screen?.calculator.amountSell ?? 5000;
  selectedCountry.value = getCountryByCurrency(
    exchangeStore.screen?.pairs ?? [],
    selectedBuyCurrency.value,
  );
  amountBuy.value = exchangeStore.quote?.amountBuy ?? null;
});

const currentRateLabel = computed(() => {
  if (!exchangeStore.quote) {
    return t('exchange.quoteUnavailable');
  }

  return `1 ${exchangeStore.quote.currencySell} = ${formatReadableNumber(exchangeStore.quote.rate, locale.value)} ${exchangeStore.quote.currencyBuy}`;
});

const canSubmit = computed(() => {
  const hasAmounts = Boolean(amountSell.value && amountSell.value > 0 && amountBuy.value && amountBuy.value > 0);
  const hasBaseFields = Boolean(selectedCountry.value && selectedSellCurrency.value && selectedBuyCurrency.value);
  const hasMethodFields = selectedMethod.value === 'qrcode' || Boolean(selectedCityId.value);
  const hasTrustedContact = authStore.trustedContactReady || contactPhone.value.trim().length >= 5;
  return hasAmounts && hasBaseFields && hasMethodFields && hasTrustedContact;
});

watch(selectedSellCurrency, () => {
  const nextBuyCurrency = buyOptions.value[0]?.value ?? selectedBuyCurrency.value;
  if (!buyOptions.value.some((option) => option.value === selectedBuyCurrency.value)) {
    selectedBuyCurrency.value = nextBuyCurrency;
    return;
  }

  if (lastEditedField.value === 'sell') {
    recalculateFromSell();
  } else {
    recalculateFromBuy();
  }
});

watch(selectedBuyCurrency, (currencyBuy) => {
  selectedCountry.value = getCountryByCurrency(exchangeStore.screen?.pairs ?? [], currencyBuy);
  if (lastEditedField.value === 'sell') {
    recalculateFromSell();
  } else {
    recalculateFromBuy();
  }
});

watch(selectedMethod, (method) => {
  selectedCityId.value = resetCityForMethod(method, selectedCityId.value);
});

watch(selectedCountry, () => {
  const nextCurrency = getCurrencyByCountry(exchangeStore.screen?.pairs ?? [], selectedCountry.value ?? '');
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
    selectedMethod.value = 'qrcode';
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
  () => exchangeStore.quote?.availableMethods ?? null,
  (availableMethods) => {
    selectedMethod.value = getPreferredReceiveMethod(availableMethods, selectedCityId.value);
  },
);

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

function recalculateFromSell() {
  syncingQuote.value = true;
  exchangeStore.recalculateQuote({
    currencySell: selectedSellCurrency.value,
    currencyBuy: selectedBuyCurrency.value,
    amountSell: amountSell.value,
    amountBuy: amountBuy.value,
    lastEdited: 'sell',
  });
  amountSell.value = exchangeStore.quote?.amountSell ?? amountSell.value;
  amountBuy.value = exchangeStore.quote?.amountBuy ?? amountBuy.value;
  syncingQuote.value = false;
}

function recalculateFromBuy() {
  syncingQuote.value = true;
  exchangeStore.recalculateQuote({
    currencySell: selectedSellCurrency.value,
    currencyBuy: selectedBuyCurrency.value,
    amountSell: amountSell.value,
    amountBuy: amountBuy.value,
    lastEdited: 'buy',
  });
  amountSell.value = exchangeStore.quote?.amountSell ?? amountSell.value;
  amountBuy.value = exchangeStore.quote?.amountBuy ?? amountBuy.value;
  syncingQuote.value = false;
}

function selectPair(pair: MiniappRateCard) {
  const [currencySell, currencyBuy] = pair.id.split('-').map((part) => part.toUpperCase());
  selectedSellCurrency.value = currencySell;
  selectedBuyCurrency.value = currencyBuy;
  selectedCountry.value = pair.country;
  amountSell.value = pair.amountSellExample;
  lastEditedField.value = 'sell';
  recalculateFromSell();
}

async function submitOrder() {
  if (!canSubmit.value || !amountSell.value || !selectedCountry.value) {
    return;
  }

  try {
    if (!authStore.trustedContactReady) {
      await authStore.saveTrustedPhone(contactPhone.value.trim());
    }

    const order = await exchangeStore.submitOrder({
      country: selectedCountry.value,
      cityId: selectedMethod.value === 'cash' ? selectedCityId.value : null,
      currencySell: selectedSellCurrency.value,
      currencyBuy: selectedBuyCurrency.value,
      amountSell: Math.round(amountSell.value),
      methodGet: selectedMethod.value,
    });

    ordersStore.prepend(order);
    amountSell.value = exchangeStore.screen?.calculator.amountSell ?? 5000;
    amountBuy.value = exchangeStore.screen?.quote.amountBuy ?? null;
    selectedMethod.value = 'qrcode';
    selectedCityId.value = null;
    contactPhone.value = '';
    await router.push({ name: 'history' });
  } catch (error: unknown) {
    const code = (error as { response?: { data?: { code?: string } } })?.response?.data?.code;
    Notify.create({ type: 'negative', message: t(getMiniappErrorMessageKey(code)) });
  }
}
</script>
