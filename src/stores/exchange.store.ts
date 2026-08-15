import { defineStore } from 'pinia';
import { ref } from 'vue';

import {
  createOrder,
  fetchCities,
  fetchExchangeScreen,
  fetchManagerAvailability,
  fetchQuote,
} from '@services/api/miniapp.service';
import type {
  MiniappCity,
  MiniappExchangeScreenResponse,
  MiniappManagerAvailability,
  MiniappOrderCreate,
  MiniappQuoteResponse,
  MiniappReceiveMethod,
} from '@types/miniapp';
import { calculateLocalQuote } from '@utils/exchange';

export const useExchangeStore = defineStore('exchange', () => {
  const screen = ref<MiniappExchangeScreenResponse | null>(null);
  const cities = ref<MiniappCity[]>([]);
  const quote = ref<MiniappQuoteResponse | null>(null);
  const loading = ref(false);
  const loaded = ref(false);
  const refreshing = ref(false);
  const submitting = ref(false);
  let refreshPromise: Promise<void> | null = null;
  let managerAvailabilityRefreshPromise: Promise<MiniappManagerAvailability> | null = null;
  let cashQuoteRequestId = 0;
  let cashQuoteAbortController: AbortController | null = null;

  function cancelCashDeliveryQuote() {
    cashQuoteRequestId += 1;
    cashQuoteAbortController?.abort();
    cashQuoteAbortController = null;
  }

  async function fetchData() {
    const [screenResponse, citiesResponse] = await Promise.all([
      fetchExchangeScreen(),
      fetchCities(),
    ]);
    screen.value = screenResponse;
    cities.value = citiesResponse.items;
    quote.value = screenResponse.quote;
  }

  async function load() {
    if (loading.value) {
      return;
    }

    loading.value = true;
    try {
      await fetchData();
    } finally {
      loaded.value = true;
      loading.value = false;
    }
  }

  async function refresh() {
    if (loading.value) {
      return;
    }
    if (refreshPromise) {
      return refreshPromise;
    }

    refreshing.value = true;
    refreshPromise = (async () => {
      try {
        await fetchData();
      } finally {
        refreshing.value = false;
        refreshPromise = null;
      }
    })();
    return refreshPromise;
  }

  /**
   * Возвращает snapshot availability менеджеров, сохраняя текущий draft обмена.
   * Одновременные pre-submit проверки используют один HTTP-запрос.
   */
  async function refreshManagerAvailability() {
    if (managerAvailabilityRefreshPromise) {
      return managerAvailabilityRefreshPromise;
    }

    managerAvailabilityRefreshPromise = (async () => {
      try {
        return await fetchManagerAvailability();
      } finally {
        managerAvailabilityRefreshPromise = null;
      }
    })();
    return managerAvailabilityRefreshPromise;
  }

  function recalculateQuote(params: {
    currencySell: string;
    currencyBuy: string;
    amountSell: number;
  }) {
    cancelCashDeliveryQuote();
    quote.value = calculateLocalQuote({
      pairs: screen.value?.pairs ?? [],
      ...params,
    });
    return quote.value;
  }

  /** Возвращает серверный snapshot quote, не заменяя exchange-screen и draft формы. */
  async function refreshQuote(params: {
    currencySell: string;
    currencyBuy: string;
    amountSell: number;
    methodGet?: MiniappReceiveMethod;
  }) {
    return fetchQuote(params);
  }

  /** Применяет только последнюю серверную котировку для доставки наличных. */
  async function refreshCashDeliveryQuote(params: {
    currencySell: string;
    currencyBuy: string;
    amountSell: number;
  }) {
    cancelCashDeliveryQuote();
    const requestId = cashQuoteRequestId;
    const controller = new AbortController();
    cashQuoteAbortController = controller;

    try {
      const freshQuote = await fetchQuote(
        { ...params, methodGet: 'cash' },
        { signal: controller.signal },
      );
      if (controller.signal.aborted || requestId !== cashQuoteRequestId) {
        return null;
      }

      quote.value = freshQuote;
      return freshQuote;
    } catch (error) {
      if (controller.signal.aborted || requestId !== cashQuoteRequestId) {
        return null;
      }
      quote.value = null;
      throw error;
    } finally {
      if (requestId === cashQuoteRequestId) {
        cashQuoteAbortController = null;
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
    cities,
    quote,
    loading,
    loaded,
    refreshing,
    submitting,
    load,
    refresh,
    refreshManagerAvailability,
    recalculateQuote,
    refreshQuote,
    refreshCashDeliveryQuote,
    cancelCashDeliveryQuote,
    submitOrder,
  };
});
