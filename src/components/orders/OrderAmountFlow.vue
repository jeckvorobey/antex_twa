<template>
  <div class="order-amount-flow" :class="{ 'order-amount-flow--result-prominent': resultProminent }">
    <div class="order-amount-flow__side order-amount-flow__side--source">
      <AppCurrencyMark :mark="managerCurrencyMark(currencySell)" />
      <strong>{{ formatAmount(amountSell, locale) }}</strong>
      <span>{{ currencySell }}</span>
    </div>
    <q-icon name="arrow_forward" class="order-amount-flow__arrow" />
    <div class="order-amount-flow__side order-amount-flow__side--result">
      <AppCurrencyMark :mark="managerCurrencyMark(currencyBuy)" />
      <strong>{{ formatAmount(amountBuy ?? 0, locale) }}</strong>
      <span>{{ currencyBuy }}</span>
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
    resultProminent?: boolean;
  }>(),
  { resultProminent: false },
);

const { locale } = useI18n();
</script>
