import { defineStore } from 'pinia';
import { ref } from 'vue';

import {
  createOrder,
  fetchCities,
  fetchExchangeScreen,
} from '@services/api/miniapp.service';
import type {
  MiniappCity,
  MiniappExchangeScreenResponse,
  MiniappOrderCreate,
  MiniappQuoteResponse,
} from '@types/miniapp';
import { calculateLocalQuote, type ExchangeEditedField } from '@utils/exchange';

export const useExchangeStore = defineStore('exchange', () => {
  const screen = ref<MiniappExchangeScreenResponse | null>(null);
  const cities = ref<MiniappCity[]>([]);
  const quote = ref<MiniappQuoteResponse | null>(null);
  const loading = ref(false);
  const submitting = ref(false);

  async function load() {
    loading.value = true;
    try {
      const [screenResponse, citiesResponse] = await Promise.all([
        fetchExchangeScreen(),
        fetchCities(),
      ]);
      screen.value = screenResponse;
      cities.value = citiesResponse.items;
      quote.value = screenResponse.quote;
    } finally {
      loading.value = false;
    }
  }

  function recalculateQuote(params: {
    currencySell: string;
    currencyBuy: string;
    amountSell: number | null;
    amountBuy: number | null;
    lastEdited: ExchangeEditedField;
  }) {
    quote.value = calculateLocalQuote({
      pairs: screen.value?.pairs ?? [],
      referenceQuote: screen.value?.quote ?? quote.value,
      ...params,
    });
    return quote.value;
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
    cities,
    quote,
    loading,
    submitting,
    load,
    recalculateQuote,
    submitOrder,
  };
});
