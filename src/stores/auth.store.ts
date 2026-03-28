import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { api } from '@boot/axios';
import { tg } from '@boot/telegram';
import { setAppLocale } from '@i18n';
import type { MiniappUser } from '@types/miniapp';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('access_token'));
  const user = ref<MiniappUser | null>(null);
  const ready = ref(false);

  const isAuthenticated = computed(() => !!token.value);

  async function init() {
    try {
      if (tg?.initData && !token.value) {
        await login(tg.initData);
      } else if (token.value) {
        await fetchUser();
      } else {
        setAppLocale(tg?.initDataUnsafe?.user?.language_code ?? 'ru');
      }
    } catch {
      logout();
    } finally {
      ready.value = true;
    }
  }

  async function login(initData: string) {
    const response = await api.post<{ access_token: string }>('/api/auth/telegram', {
      init_data: initData,
    });
    token.value = response.data.access_token;
    localStorage.setItem('access_token', token.value);
    await fetchUser();
  }

  async function fetchUser() {
    const response = await api.get<MiniappUser>('/api/users/me');
    user.value = response.data;
    setAppLocale(user.value.language_code ?? tg?.initDataUnsafe?.user?.language_code ?? 'ru');
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('access_token');
  }

  return {
    token,
    user,
    ready,
    isAuthenticated,
    init,
    login,
    fetchUser,
    logout,
  };
});
