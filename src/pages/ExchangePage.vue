<template>
  <q-page class="app-page">
    <div class="app-screen app-screen--exchange">
      <AppStatusBar />

      <AppSurface class="app-exchange-calculator">
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
              v-model.number="amountSell"
              class="app-exchange-calculator__amount"
              type="number"
              borderless
              dense
              input-class="text-right"
              min="1"
            />
          </div>
        </div>

        <div class="app-exchange-calculator__swap">
          <q-btn
            round
            unelevated
            class="app-exchange-calculator__swap-button"
            icon="swap_vert"
            @click="swapCurrencies"
          />
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

            <div class="app-exchange-calculator__result">
              {{ exchangeStore.quote ? formatAmount(exchangeStore.quote.amountBuy, locale) : '—' }}
            </div>
          </div>
        </div>

        <div class="app-exchange-calculator__rate">
          {{ currentRateLabel }}
        </div>

        <q-inner-loading :showing="exchangeStore.quoteLoading" dark />
      </AppSurface>

      <div class="app-chip-row app-chip-row--exchange">
        <q-chip
          v-for="chip in exchangeStore.screen?.chips ?? []"
          :key="chip"
          clickable
          :class="['app-chip', selectedSellCurrency === chip ? 'app-chip--active' : null]"
          @click="selectedSellCurrency = chip"
        >
          {{ chip }}
        </q-chip>
      </div>

      <section class="app-section">
        <AppSectionTitle>{{ t('exchange.availablePairs') }}</AppSectionTitle>

        <div class="app-exchange-pairs">
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

            <AppRateValue :value="formatPairRate(pair.rate)" shimmer />

            <div class="app-exchange-pair-card__meta">
              {{ formatMiniappDateTime(pair.updatedAt, locale) }}
            </div>

            <AppButton block class="app-exchange-pair-card__button" @click="selectPair(pair)">
              {{ t('common.exchange') }}
            </AppButton>
          </AppSurface>
        </div>
      </section>

      <AppButton
        block
        :loading="exchangeStore.quoteLoading"
        :disable="!canSubmitQuote"
        @click="openSheetFromQuote"
      >
        {{ t('common.submit') }}
      </AppButton>

      <q-inner-loading :showing="exchangeStore.loading" dark />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import AppButton from '@components/ui/AppButton.vue';
import AppRateValue from '@components/ui/AppRateValue.vue';
import AppSectionTitle from '@components/ui/AppSectionTitle.vue';
import AppStatusBar from '@components/ui/AppStatusBar.vue';
import AppSurface from '@components/ui/AppSurface.vue';
import { useExchangeStore } from '@stores/exchange.store';
import { useUiStore } from '@stores/ui.store';
import type { MiniappRateCard } from '@types/miniapp';
import { formatAmount, formatMiniappDateTime } from '@utils/formatters';
import { isQuoteCurrent } from '@utils/miniapp';

const exchangeStore = useExchangeStore();
const uiStore = useUiStore();
const { locale, t } = useI18n();

const selectedSellCurrency = ref('RUB');
const selectedBuyCurrency = ref('THB');
const amountSell = ref<number | null>(5000);

const sellOptions = computed(() =>
  (exchangeStore.screen?.chips ?? ['RUB', 'USDT']).map((chip) => ({
    label: chip,
    value: chip,
  })),
);

onMounted(async () => {
  if (!exchangeStore.screen) {
    await exchangeStore.load();
  }

  selectedSellCurrency.value = exchangeStore.screen?.calculator.fromCurrency ?? 'RUB';
  selectedBuyCurrency.value = exchangeStore.screen?.calculator.toCurrency ?? 'THB';
  amountSell.value = exchangeStore.screen?.calculator.amountSell ?? 5000;
});

const buyOptions = computed(() => {
  if (selectedSellCurrency.value === 'USDT') {
    return [{ label: 'THB', value: 'THB' }];
  }

  return [
    { label: 'THB', value: 'THB' },
    { label: 'USDT', value: 'USDT' },
  ];
});

const canSubmitQuote = computed(() =>
  !exchangeStore.quoteLoading
  && isQuoteCurrent(exchangeStore.quote, {
    currencySell: selectedSellCurrency.value,
    currencyBuy: selectedBuyCurrency.value,
    amountSell: amountSell.value,
  }),
);
const currentRateLabel = computed(() => {
  if (!exchangeStore.quote) {
    return t('exchange.quoteUnavailable');
  }

  return `1 ${exchangeStore.quote.currencySell} = ${formatPairRate(exchangeStore.quote.rate)} ${exchangeStore.quote.currencyBuy}`;
});

watch(selectedSellCurrency, (value) => {
  if (value === 'USDT' && selectedBuyCurrency.value !== 'THB') {
    selectedBuyCurrency.value = 'THB';
  }
});

let quoteDebounceTimer: ReturnType<typeof setTimeout> | undefined;

watch([selectedSellCurrency, selectedBuyCurrency, amountSell], ([currencySell, currencyBuy, sellAmount]) => {
  clearTimeout(quoteDebounceTimer);
  if (!sellAmount || sellAmount <= 0) {
    return;
  }

  quoteDebounceTimer = setTimeout(() => {
    void exchangeStore.refreshQuote({ currencySell, currencyBuy, amountSell: sellAmount });
  }, 250);
});

onBeforeUnmount(() => {
  clearTimeout(quoteDebounceTimer);
});

/**
 * Меняет местами валюты в калькуляторе, если пара поддерживается.
 */
function swapCurrencies() {
  if (selectedSellCurrency.value === 'RUB' && selectedBuyCurrency.value === 'THB') {
    selectedSellCurrency.value = 'USDT';
    selectedBuyCurrency.value = 'THB';
    return;
  }

  selectedSellCurrency.value = 'RUB';
  selectedBuyCurrency.value = 'THB';
}

function selectPair(pair: MiniappRateCard) {
  selectedSellCurrency.value = pair.fromCurrency;
  selectedBuyCurrency.value = pair.toCurrency;
  amountSell.value = pair.amountSellExample;
  uiStore.openOrderSheet({
    currencySell: pair.fromCurrency,
    currencyBuy: pair.toCurrency,
    amountSell: pair.amountSellExample,
    amountBuy: pair.amountBuyExample,
    rate: pair.rate,
  });
}

/**
 * Открывает форму заявки по текущему рассчитанному quote.
 */
function openSheetFromQuote() {
  if (!canSubmitQuote.value || !exchangeStore.quote) {
    return;
  }

  uiStore.openOrderSheet({
    currencySell: exchangeStore.quote.currencySell,
    currencyBuy: exchangeStore.quote.currencyBuy,
    amountSell: exchangeStore.quote.amountSell,
    amountBuy: exchangeStore.quote.amountBuy,
    rate: exchangeStore.quote.rate,
  });
}

function formatPairRate(rate: number) {
  return rate >= 1 ? rate.toFixed(1) : rate.toFixed(4);
}
</script>
