import { defineStore } from 'pinia';
import { ref } from 'vue';

import { fetchHome } from '@services/api/miniapp.service';
import type { MiniappHomeResponse } from '@types/miniapp';

export const useHomeStore = defineStore('home', () => {
  const data = ref<MiniappHomeResponse | null>(null);
  const loading = ref(false);
  const loaded = ref(false);
  const refreshing = ref(false);

  async function fetchData() {
    data.value = await fetchHome();
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
    if (loading.value || refreshing.value) {
      return;
    }

    refreshing.value = true;
    try {
      await fetchData();
    } finally {
      refreshing.value = false;
    }
  }

  return { data, loading, loaded, refreshing, load, refresh };
});
