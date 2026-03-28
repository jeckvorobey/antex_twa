import { defineStore } from 'pinia';
import { ref } from 'vue';

import {
  createOrder,
  fetchExchangeScreen,
  fetchQuote,
} from '@services/api/miniapp.service';
import type {
  MiniappExchangeScreenResponse,
  MiniappOrderCreate,
  MiniappQuoteResponse,
} from '@types/miniapp';

export const useExchangeStore = defineStore('exchange', () => {
  const screen = ref<MiniappExchangeScreenResponse | null>(null);
  const quote = ref<MiniappQuoteResponse | null>(null);
  const loading = ref(false);
  const quoteLoading = ref(false);
  const submitting = ref(false);
  const quoteRequestId = ref(0);

  async function load() {
    loading.value = true;
    try {
      screen.value = await fetchExchangeScreen();
      quote.value = screen.value.quote;
    } finally {
      loading.value = false;
    }
  }

  async function refreshQuote(params: { currencySell: string; currencyBuy: string; amountSell: number }) {
    const requestId = ++quoteRequestId.value;
    quoteLoading.value = true;

    try {
      const nextQuote = await fetchQuote(params);
      if (requestId !== quoteRequestId.value) {
        return null;
      }

      quote.value = nextQuote;
      return nextQuote;
    } finally {
      if (requestId === quoteRequestId.value) {
        quoteLoading.value = false;
      }
    }
  }

  async function submitOrder(payload: MiniappOrderCreate) {
    submitting.value = true;
    try {
      return await createOrder(payload);
    } finally {
      submitting.value = false;
    }
  }

  return {
    screen,
    quote,
    loading,
    quoteLoading,
    submitting,
    load,
    refreshQuote,
    submitOrder,
  };
});
