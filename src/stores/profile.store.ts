import { defineStore } from 'pinia';
import { ref } from 'vue';

import { fetchProfile } from '@services/api/miniapp.service';
import type { MiniappProfileResponse } from '@types/miniapp';

export const useProfileStore = defineStore('profile', () => {
  const data = ref<MiniappProfileResponse | null>(null);
  const loading = ref(false);

  async function load() {
    loading.value = true;
    try {
      data.value = await fetchProfile();
    } finally {
      loading.value = false;
    }
  }

  return { data, loading, load };
});
