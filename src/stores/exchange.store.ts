import { defineStore } from 'pinia';
import { ref } from 'vue';

import {
  createOrder,
  fetchCities,
  fetchExchangeScreen,
  fetchManagerAvailability,
} from '@services/api/miniapp.service';
import type {
  MiniappCity,
  MiniappExchangeScreenResponse,
  MiniappOrderCreate,
  MiniappQuoteResponse,
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
  let managerAvailabilityRefreshPromise: Promise<void> | null = null;

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
   * Обновляет только availability менеджеров, сохраняя текущий draft обмена.
   * Одновременные pre-submit проверки используют один HTTP-запрос.
   */
  async function refreshManagerAvailability() {
    if (managerAvailabilityRefreshPromise) {
      return managerAvailabilityRefreshPromise;
    }

    managerAvailabilityRefreshPromise = (async () => {
      try {
        const availability = await fetchManagerAvailability();
        if (screen.value) {
          screen.value.managerAvailability = availability;
        }
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
    quote.value = calculateLocalQuote({
      pairs: screen.value?.pairs ?? [],
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
    loaded,
    refreshing,
    submitting,
    load,
    refresh,
    refreshManagerAvailability,
    recalculateQuote,
    submitOrder,
  };
});
