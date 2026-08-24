import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { api } from '@boot/axios';
import { tg } from '@boot/telegram';
import { setAppLocale } from '@i18n';
import type {
  MiniappNavigationItem,
  MiniappUser,
  TelegramAuthResponse,
  TelegramWriteAccessOutcome,
  TelegramWriteAccessResponse,
  TrustedContactState,
} from '@types/miniapp';

export const DEFAULT_USER_NAVIGATION: MiniappNavigationItem[] = [
  { name: 'home', icon: 'home', label: 'Главная', route: 'home' },
  { name: 'exchange', icon: 'currency_exchange', label: 'Обмен', route: 'exchange' },
  { name: 'history', icon: 'history', label: 'История', route: 'history' },
  { name: 'profile', icon: 'person_outline', label: 'Профиль', route: 'profile' },
];

export type TelegramWriteAccessState =
  | 'idle'
  | 'requesting'
  | 'syncing'
  | 'allowed'
  | 'denied'
  | 'unsupported'
  | 'sync_error'
  | 'auth_error';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('access_token'));
  const user = ref<MiniappUser | null>(null);
  const ready = ref(false);
  const phoneSaving = ref(false);
  const isNewUser = ref(false);
  const telegramWriteAccess = ref(false);
  const writeAccessState = ref<TelegramWriteAccessState>('idle');
  const nativeWriteAccessGranted = ref(false);
  let writeAccessRequest: Promise<void> | null = null;

  const isAuthenticated = computed(() => !!token.value);
  const trustedContactReady = computed(() => user.value?.trusted_contact_ready ?? false);
  const requiresTelegramWriteAccess = computed(
    () => Boolean(tg?.initData) && (!isAuthenticated.value || !telegramWriteAccess.value),
  );
  const canUseApp = computed(() => !requiresTelegramWriteAccess.value);
  const navigation = computed<MiniappNavigationItem[]>(() => {
    return user.value?.navigation ?? [];
  });

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
      if (tg?.initData) {
        user.value = null;
        telegramWriteAccess.value = false;
        writeAccessState.value = 'auth_error';
      } else {
        setGuestUser();
      }
    } finally {
      ready.value = true;
    }
  }

  async function login(initData: string) {
    const response = await api.post<TelegramAuthResponse>('/api/auth/telegram', {
      init_data: initData,
    });
    token.value = response.data.access_token;
    isNewUser.value = response.data.is_new_user;
    telegramWriteAccess.value = response.data.telegram_write_access;
    writeAccessState.value = telegramWriteAccess.value ? 'allowed' : 'idle';
    localStorage.setItem('access_token', token.value);
    await fetchUser();
  }

  async function fetchUser() {
    const response = await api.get<MiniappUser>('/api/users/me');
    user.value = response.data;
    telegramWriteAccess.value = response.data.telegram_write_access;
    if (telegramWriteAccess.value) {
      writeAccessState.value = 'allowed';
    }
    setAppLocale(user.value.language_code ?? tg?.initDataUnsafe?.user?.language_code ?? 'ru');
  }

  async function syncTelegramWriteAccess(status: TelegramWriteAccessOutcome) {
    writeAccessState.value = 'syncing';
    try {
      const response = await api.post<TelegramWriteAccessResponse>(
        '/api/users/me/telegram-write-access',
        { status },
      );
      telegramWriteAccess.value = response.data.telegram_write_access;
      if (user.value) {
        user.value.telegram_write_access = response.data.telegram_write_access;
      }
      writeAccessState.value = response.data.telegram_write_access
        ? 'allowed'
        : status === 'unsupported'
          ? 'unsupported'
          : 'denied';
    } catch {
      writeAccessState.value =
        status === 'allowed' ? 'sync_error' : status === 'unsupported' ? 'unsupported' : 'denied';
    }
  }

  async function runTelegramWriteAccessRequest() {
    if (telegramWriteAccess.value) {
      writeAccessState.value = 'allowed';
      return;
    }
    if (nativeWriteAccessGranted.value) {
      await syncTelegramWriteAccess('allowed');
      return;
    }
    if (!tg?.requestWriteAccess) {
      await syncTelegramWriteAccess('unsupported');
      return;
    }

    writeAccessState.value = 'requesting';
    const allowed = await new Promise<boolean>((resolve) => {
      tg.requestWriteAccess?.(resolve);
    });
    if (allowed) {
      nativeWriteAccessGranted.value = true;
      await syncTelegramWriteAccess('allowed');
      return;
    }
    await syncTelegramWriteAccess('cancelled');
  }

  async function requestTelegramWriteAccess() {
    if (writeAccessRequest) {
      return writeAccessRequest;
    }
    writeAccessRequest = runTelegramWriteAccessRequest();
    try {
      await writeAccessRequest;
    } finally {
      writeAccessRequest = null;
    }
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
    isNewUser.value = false;
    telegramWriteAccess.value = false;
    nativeWriteAccessGranted.value = false;
    writeAccessState.value = 'idle';
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
      photo_url: telegramUser?.photo_url ?? null,
      is_bot: false,
      is_premium: telegramUser?.is_premium ?? false,
      telegram_write_access: false,
      role: 9,
      trusted_contact: telegramUser?.username ?? null,
      trusted_contact_source: telegramUser?.username ? 'username' : null,
      trusted_contact_ready: Boolean(telegramUser?.username),
      navigation: DEFAULT_USER_NAVIGATION,
    };
    setAppLocale(user.value.language_code ?? 'ru');
  }

  return {
    token,
    user,
    ready,
    phoneSaving,
    isNewUser,
    telegramWriteAccess,
    writeAccessState,
    isAuthenticated,
    trustedContactReady,
    requiresTelegramWriteAccess,
    canUseApp,
    navigation,
    init,
    login,
    fetchUser,
    saveTrustedPhone,
    requestTelegramWriteAccess,
    logout,
  };
});
