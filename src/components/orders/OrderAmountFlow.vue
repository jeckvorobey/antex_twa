<template>
  <div class="order-amount-flow order-amount-flow--card-stack">
    <div class="order-amount-flow__row order-amount-flow__row--source">
      <AppCurrencyMark class="order-amount-flow__mark" :mark="managerCurrencyMark(currencySell)" />
      <strong class="order-amount-flow__source-amount">{{ formatAmount(amountSell, locale) }}</strong>
      <span class="order-amount-flow__source-currency">{{ currencySell }}</span>
      <q-icon name="south_east" class="order-amount-flow__direction" aria-hidden="true" />
      <span v-if="rateText" class="order-amount-flow__rate-inline">{{ rateText }}</span>
    </div>
    <div class="order-amount-flow__row order-amount-flow__row--result">
      <AppCurrencyMark class="order-amount-flow__mark" :mark="managerCurrencyMark(currencyBuy)" />
      <strong class="order-amount-flow__result-amount">{{ formatAmount(amountBuy ?? 0, locale) }}</strong>
      <span class="order-amount-flow__result-currency">{{ currencyBuy }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import AppCurrencyMark from '@components/ui/AppCurrencyMark.vue';
import { formatAmount } from '@utils/formatters';
import { managerCurrencyMark } from '@utils/manager-chat';

withDefaults(
  defineProps<{
    currencySell: string;
    amountSell: number;
    currencyBuy: string;
    amountBuy: number | null;
    rateText?: string | null;
  }>(),
  { rateText: null },
);

const { locale } = useI18n();
</script>
