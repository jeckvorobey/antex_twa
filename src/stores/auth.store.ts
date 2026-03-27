import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from 'src/boot/axios';
import { tg } from 'src/boot/telegram';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('access_token'));
  const user = ref<Record<string, unknown> | null>(null);

  async function init() {
    if (tg?.initData) {
      await login(tg.initData);
    }
  }

  async function login(initData: string) {
    const res = await api.post('/api/auth/telegram', { init_data: initData });
    token.value = res.data.access_token;
    localStorage.setItem('access_token', token.value as string);
    await fetchUser();
  }

  async function fetchUser() {
    const res = await api.get('/api/users/me');
    user.value = res.data;
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('access_token');
  }

  return { token, user, init, login, logout };
});
