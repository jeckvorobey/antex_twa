import { defineStore } from 'pinia';
import { ref } from 'vue';

import { fetchHome } from '@services/api/miniapp.service';
import type { MiniappHomeResponse } from '@types/miniapp';

export const useHomeStore = defineStore('home', () => {
  const data = ref<MiniappHomeResponse | null>(null);
  const loading = ref(false);

  async function load() {
    loading.value = true;
    try {
      data.value = await fetchHome();
    } finally {
      loading.value = false;
    }
  }

  return { data, loading, load };
});
