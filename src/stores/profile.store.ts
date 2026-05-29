import { defineStore } from 'pinia';
import { ref } from 'vue';

import { fetchProfile } from '@services/api/miniapp.service';
import type { MiniappProfileResponse } from '@types/miniapp';

export const useProfileStore = defineStore('profile', () => {
  const data = ref<MiniappProfileResponse | null>(null);
  const loading = ref(false);
  const loaded = ref(false);
  const refreshing = ref(false);

  async function fetchData() {
    data.value = await fetchProfile();
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
