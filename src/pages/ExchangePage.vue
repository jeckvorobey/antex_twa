<template>
  <q-page class="app-page app-page--exchange">
    <div class="app-screen app-screen--exchange fit column no-wrap">
      <q-form class="col column no-wrap" @submit.prevent="submitOrder">
        <div class="col column q-gutter-md no-wrap overflow-auto">
          <AppSurface class="app-exchange-calculator">
            <div class="column q-gutter-sm">
              <div class="app-exchange-calculator__field">
                <div class="app-exchange-calculator__label">{{ t('exchange.payAmount') }}</div>
                <div class="app-exchange-calculator__control">
                  <q-select
                    v-model="selectedSellCurrency"
                    :options="sellOptions"
                    class="app-exchange-calculator__currency"
                    borderless
                    dense
                    emit-value
                    map-options
                    behavior="menu"
                  />
                  <q-input
                    :model-value="formattedAmountSell"
                    class="app-exchange-calculator__amount"
                    type="text"
                    borderless
                    dense
                    inputmode="decimal"
                    input-class="text-right"
                    @update:model-value="handleSellAmountInput"
                  />
                </div>
              </div>

              <div class="app-exchange-calculator__field">
                <div class="app-exchange-calculator__label">{{ t('exchange.receiveCurrency') }}</div>
                <div class="app-exchange-calculator__control">
                  <q-select
                    v-model="selectedBuyCurrency"
                    :options="buyOptions"
                    class="app-exchange-calculator__currency"
                    borderless
                    dense
                    emit-value
                    map-options
                    behavior="menu"
                  />
                  <q-input
                    :model-value="formattedAmountBuy"
                    class="app-exchange-calculator__amount"
                    type="text"
                    borderless
                    dense
                    inputmode="decimal"
                    input-class="text-right text-antex-gold"
                    @update:model-value="handleBuyAmountInput"
                  />
                </div>
              </div>
            </div>

            <div class="app-exchange-calculator__rate">
              {{ currentRateLabel }}
            </div>
          </AppSurface>

          <div class="app-chip-row app-chip-row--exchange">
            <q-chip
              v-for="country in countryOptions"
              :key="country.value"
              clickable
              :class="['app-chip', selectedCountry === country.value ? 'app-chip--active' : null]"
              @click="selectCountry(country.value)"
            >
              {{ country.label }}
            </q-chip>
          </div>

          <AppSurface class="app-order-sheet">
            <div class="app-order-sheet__fields">
              <div class="app-order-sheet__field">
                <div class="app-order-sheet__label">{{ receiveLocationTitle }}</div>
                <div class="row q-col-gutter-sm">
                  <div v-if="receiveLocationLabel" class="col-12">
                    <div class="app-order-sheet__control">
                      <span class="text-body2">{{ receiveLocationLabel }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="app-order-sheet__field">
                <div class="app-order-sheet__label">{{ t('exchange.receiveMethod') }}</div>
                <q-option-group
                  v-model="selectedMethod"
                  class="app-order-sheet__methods q-mt-xs"
                  :options="methodOptions"
                  color="warning"
                />
              </div>

              <div
                v-if="selectedMethod === 'cash'"
                class="app-order-sheet__field"
              >
                <div class="app-order-sheet__label">{{ t('exchange.cashCities') }}</div>
                <div class="app-home-location-chips">
                  <q-chip
                    v-for="city in cityOptions"
                    :key="city.value"
                    clickable
                    :class="['app-chip', selectedCityId === city.value ? 'app-chip--active' : null]"
                    @click="selectCity(city.value)"
                  >
                    {{ city.label }}
                  </q-chip>
                </div>
              </div>

              <div v-if="!authStore.trustedContactReady" class="app-order-sheet__field">
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

import AppButton from '@components/ui/AppButton.vue';
import AppRateValue from '@components/ui/AppRateValue.vue';
import AppSectionTitle from '@components/ui/AppSectionTitle.vue';
import AppSurface from '@components/ui/AppSurface.vue';
import { useAuthStore } from '@stores/auth.store';
import { useExchangeStore } from '@stores/exchange.store';
import { useOrdersStore } from '@stores/orders.store';
import type { MiniappRateCard } from '@types/miniapp';
import { getMiniappErrorMessageKey } from '@utils/api-errors';
import { normalizeCityLabel, normalizeCountryLabel } from '@utils/display';
import { formatMiniappDateTime, formatReadableNumber, parseReadableNumber } from '@utils/formatters';
import {
  buildReceiveLocationLabel,
  buildBuyCurrencyOptions,
  getCountryByCurrency,
  getCountryLabelByCurrency,
  getCurrencyByCountry,
  getReceiveLocationTitleKey,
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
  buyOptions.value
    .map((option) => ({
      value: getCountryByCurrency(exchangeStore.screen?.pairs ?? [], option.value),
      label: normalizeCountryLabel(
        getCountryLabelByCurrency(exchangeStore.screen?.pairs ?? [], option.value) ?? option.value,
      ),
    }))
    .filter((option): option is { value: string; label: string } => Boolean(option.value)),
);

const selectedCountryLabel = computed(
  () => countryOptions.value.find((country) => country.value === selectedCountry.value)?.label ?? null,
);

const selectedCityLabel = computed(
  () => cityOptions.value.find((city) => city.value === selectedCityId.value)?.label ?? null,
);

const receiveLocationTitle = computed(() => t(getReceiveLocationTitleKey(selectedMethod.value)));

const receiveLocationLabel = computed(() => buildReceiveLocationLabel({
  method: selectedMethod.value,
  countryLabel: selectedCountryLabel.value,
  cityLabel: selectedCityLabel.value,
}));
const formattedAmountSell = computed(() => formatReadableNumber(amountSell.value, locale.value));
const formattedAmountBuy = computed(() => formatReadableNumber(amountBuy.value, locale.value));

function normalizeCountryKey(value: unknown): string {
  if (!value) {
    return '';
  }

  const raw = String(value).trim().toLowerCase();
  const withoutPrefix = raw.replace(/^country\./, '');
  const map: Record<string, string> = {
    th: 'thailand',
    thailand: 'thailand',
    тайланд: 'thailand',
    vn: 'vietnam',
    vietnam: 'vietnam',
    вьетнам: 'vietnam',
    ge: 'georgia',
    georgia: 'georgia',
    грузия: 'georgia',
  };

  return map[withoutPrefix] ?? withoutPrefix;
}

const cityOptions = computed(() =>
  exchangeStore.cities
    .filter((city) => {
      const selected = normalizeCountryKey(selectedCountry.value);
      if (!selected) {
        return false;
      }
      const candidates = [
        normalizeCountryKey(city.country),
        normalizeCountryKey(city.countryCode),
        normalizeCountryKey(city.countryRuName),
      ];
      return candidates.includes(selected);
    })
    .map((city) => ({
      label: normalizeCityLabel(city.name),
      value: city.id,
    })),
);

const methodOptions = computed(() => [
  { label: t('exchange.qrcode'), value: 'qrcode' },
  { label: t('exchange.cash'), value: 'cash' },
]);

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
  if (selectedMethod.value !== 'cash') {
    return;
  }
  selectedCityId.value = cityOptions.value[0]?.value ?? null;
});

watch(cityOptions, (options) => {
  if (selectedMethod.value !== 'cash') {
    return;
  }
  if (!options.length) {
    selectedCityId.value = null;
    return;
  }
  if (!options.some((option) => option.value === selectedCityId.value)) {
    selectedCityId.value = options[0].value;
  }
});

function recalculateFromSell() {
  exchangeStore.recalculateQuote({
    currencySell: selectedSellCurrency.value,
    currencyBuy: selectedBuyCurrency.value,
    amountSell: amountSell.value,
    amountBuy: amountBuy.value,
    lastEdited: 'sell',
  });
  amountSell.value = exchangeStore.quote?.amountSell ?? amountSell.value;
  amountBuy.value = exchangeStore.quote?.amountBuy ?? amountBuy.value;
}

function recalculateFromBuy() {
  exchangeStore.recalculateQuote({
    currencySell: selectedSellCurrency.value,
    currencyBuy: selectedBuyCurrency.value,
    amountSell: amountSell.value,
    amountBuy: amountBuy.value,
    lastEdited: 'buy',
  });
  amountSell.value = exchangeStore.quote?.amountSell ?? amountSell.value;
  amountBuy.value = exchangeStore.quote?.amountBuy ?? amountBuy.value;
}

function handleSellAmountInput(value: string | number | null) {
  amountSell.value = parseReadableNumber(value);
  lastEditedField.value = 'sell';
  recalculateFromSell();
}

function handleBuyAmountInput(value: string | number | null) {
  amountBuy.value = parseReadableNumber(value);
  lastEditedField.value = 'buy';
  recalculateFromBuy();
}

function selectCountry(country: string) {
  selectedCountry.value = country;
  const nextCurrency = getCurrencyByCountry(exchangeStore.screen?.pairs ?? [], country);
  if (nextCurrency) {
    selectedBuyCurrency.value = nextCurrency;
  }
  if (selectedMethod.value === 'cash' && cityOptions.value.length) {
    selectedCityId.value = cityOptions.value[0].value;
  }
}

function selectCity(cityId: number) {
  selectedCityId.value = cityId;
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
