import { defineStore } from 'pinia';
import { ref } from 'vue';

import type { MiniappQuoteResponse } from '@types/miniapp';

type OrderContext = Pick<
  MiniappQuoteResponse,
  'currencySell' | 'currencyBuy' | 'amountSell'
> & {
  amountBuy?: MiniappQuoteResponse['amountBuy'];
  rate?: MiniappQuoteResponse['rate'];
  availableMethods?: MiniappQuoteResponse['availableMethods'];
  country?: string | null;
  cityId?: number | null;
};

export const useUiStore = defineStore('ui', () => {
  const moreSheetOpen = ref(false);
  const orderSheetOpen = ref(false);
  const orderContext = ref<OrderContext | null>(null);

  function openMoreSheet() {
    moreSheetOpen.value = true;
  }

  function closeMoreSheet() {
    moreSheetOpen.value = false;
  }

  function openOrderSheet(context?: OrderContext | null) {
    orderContext.value = context ?? null;
    orderSheetOpen.value = true;
  }

  function closeOrderSheet() {
    orderSheetOpen.value = false;
  }

  return {
    moreSheetOpen,
    orderSheetOpen,
    orderContext,
    openMoreSheet,
    closeMoreSheet,
    openOrderSheet,
    closeOrderSheet,
  };
});
