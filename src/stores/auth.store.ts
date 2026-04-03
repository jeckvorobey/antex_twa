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
      if (tg?.initData) {
        await login(tg.initData);
      } else if (token.value) {
        await fetchUser();
      } else {
        setGuestUser();
      }
    } catch {
      token.value = null;
      localStorage.removeItem('access_token');
      setGuestUser();
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

  function setGuestUser() {
    user.value = {
      id: 9_999_001,
      username: tg?.initDataUnsafe?.user?.username ?? 'sergeywebdev',
      first_name: tg?.initDataUnsafe?.user?.first_name ?? 'Sergei',
      last_name: tg?.initDataUnsafe?.user?.last_name ?? 'V',
      language_code: tg?.initDataUnsafe?.user?.language_code ?? 'ru',
      is_bot: false,
      is_premium: tg?.initDataUnsafe?.user?.is_premium ?? true,
      role: 9,
    };
    setAppLocale(user.value.language_code ?? 'ru');
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
