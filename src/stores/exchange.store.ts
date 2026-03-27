import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from 'src/boot/axios';
import type { ExchangeRates } from 'src/types/exchange.interface';

export const useExchangeStore = defineStore('exchange', () => {
  const rates = ref<ExchangeRates | null>(null);
  const loading = ref(false);

  async function fetchRates() {
    loading.value = true;
    try {
      const res = await api.get('/api/exchange/rates');
      rates.value = res.data;
    } finally {
      loading.value = false;
    }
  }

  return { rates, loading, fetchRates };
});
