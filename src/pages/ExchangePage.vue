<template>
  <q-page class="app-page q-pt-md">
    <div class="app-page__content">
      <AppSurface padded>
        <div class="column q-gutter-md">
          <div class="row q-col-gutter-sm">
            <div
              v-for="chip in exchangeStore.screen?.chips ?? []"
              :key="chip"
              class="col-auto"
            >
              <q-chip
                clickable
                :class="['app-chip', selectedSellCurrency === chip ? 'app-chip--active' : null]"
                @click="selectedSellCurrency = chip"
              >
                {{ chip }}
              </q-chip>
            </div>
          </div>

          <AppInputField
            v-model="amountSell"
            :label="t('exchange.payAmount')"
            type="number"
            min="1"
          />

          <AppInputField
            v-model="selectedBuyCurrency"
            :label="t('exchange.receiveCurrency')"
            :options="buyOptions"
            type="select"
          />

          <div class="app-surface app-surface--deep q-pa-md" style="position: relative;">
            <div class="app-muted text-caption q-mb-xs">{{ t('exchange.rateLabel') }}</div>
            <div class="app-rate-value app-gradient-text q-mb-xs">{{ exchangeStore.quote?.rateText }}</div>
            <div class="app-secondary-text text-body2">
              {{ exchangeStore.quote ? formatAmount(exchangeStore.quote.amountBuy) : '—' }}
              {{ exchangeStore.quote?.currencyBuy }}
            </div>
            <q-inner-loading :showing="exchangeStore.quoteLoading" dark />
          </div>
        </div>
      </AppSurface>

      <section>
        <AppSectionTitle class="q-mb-md">{{ t('exchange.availablePairs') }}</AppSectionTitle>
        <div class="column q-gutter-md">
          <AppSurface
            v-for="pair in exchangeStore.screen?.pairs ?? []"
            :key="pair.id"
            padded
          >
            <div class="row items-center justify-between q-mb-sm">
              <div class="text-body1 text-weight-medium">{{ pair.label }}</div>
              <div class="app-muted text-caption">{{ formatUpdatedAt(pair.updatedAt) }}</div>
            </div>
            <div class="app-rate-value app-gold-glow q-mb-xs">{{ pair.rateText }}</div>
            <div class="app-secondary-text text-caption q-mb-md">
              {{ pair.amountSellExample }} {{ pair.fromCurrency }} -> {{ formatAmount(pair.amountBuyExample) }}
              {{ pair.toCurrency }}
            </div>
            <AppButton block @click="selectPair(pair)">{{ t('common.exchange') }}</AppButton>
          </AppSurface>
        </div>
      </section>

      <AppButton
        block
        :loading="exchangeStore.quoteLoading"
        :disable="!canSubmitQuote"
        @click="openSheetFromQuote"
      >{{ t('common.submit') }}</AppButton>

      <q-inner-loading :showing="exchangeStore.loading" dark />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import AppButton from '@components/ui/AppButton.vue';
import AppInputField from '@components/ui/AppInputField.vue';
import AppSectionTitle from '@components/ui/AppSectionTitle.vue';
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

onMounted(async () => {
  if (!exchangeStore.screen) {
    await exchangeStore.load();
    selectedSellCurrency.value = exchangeStore.screen?.calculator.fromCurrency ?? 'RUB';
    selectedBuyCurrency.value = exchangeStore.screen?.calculator.toCurrency ?? 'THB';
    amountSell.value = exchangeStore.screen?.calculator.amountSell ?? 5000;
  }
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
  }, 300);
});

onBeforeUnmount(() => {
  clearTimeout(quoteDebounceTimer);
});

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

function formatUpdatedAt(value: string) {
  return formatMiniappDateTime(value, locale.value);
}
</script>
