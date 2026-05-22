import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { api } from '@boot/axios';
import { tg } from '@boot/telegram';
import { setAppLocale } from '@i18n';
import type { MiniappUser, TrustedContactState } from '@types/miniapp';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('access_token'));
  const user = ref<MiniappUser | null>(null);
  const ready = ref(false);
  const phoneSaving = ref(false);

  const isAuthenticated = computed(() => !!token.value);
  const trustedContactReady = computed(() => user.value?.trusted_contact_ready ?? false);

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

  async function saveTrustedPhone(phone: string) {
    if (!user.value) {
      return null;
    }

    phoneSaving.value = true;
    try {
      const response = await api.put<TrustedContactState>('/api/auth/contact', { phone });
      user.value = {
        ...user.value,
        phone: response.data.phone,
        trusted_contact: response.data.contact,
        trusted_contact_source: response.data.source,
        trusted_contact_ready: response.data.ready,
      };
      return response.data;
    } finally {
      phoneSaving.value = false;
    }
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('access_token');
  }

  function setGuestUser() {
    const telegramUser = tg?.initDataUnsafe?.user;
    user.value = {
      id: telegramUser?.id ?? 0,
      username: telegramUser?.username ?? null,
      phone: null,
      first_name: telegramUser?.first_name ?? null,
      last_name: telegramUser?.last_name ?? null,
      language_code: telegramUser?.language_code ?? 'ru',
      is_bot: false,
      is_premium: telegramUser?.is_premium ?? false,
      role: 9,
      trusted_contact: telegramUser?.username ?? null,
      trusted_contact_source: telegramUser?.username ? 'username' : null,
      trusted_contact_ready: Boolean(telegramUser?.username),
    };
    setAppLocale(user.value.language_code ?? 'ru');
  }

  return {
    token,
    user,
    ready,
    phoneSaving,
    isAuthenticated,
    trustedContactReady,
    init,
    login,
    fetchUser,
    saveTrustedPhone,
    logout,
  };
});
