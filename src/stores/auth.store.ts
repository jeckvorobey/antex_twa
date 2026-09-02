import { defineStore } from 'pinia';
import { isAxiosError } from 'axios';
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
  | 'authenticating'
  | 'requesting'
  | 'syncing'
  | 'allowed'
  | 'denied'
  | 'unsupported'
  | 'sync_error'
  | 'auth_error'
  | 'reopen_required';

const TELEGRAM_SESSION_BINDING_KEY = 'telegram_session_binding';

/** Отпечаток связывает запуск с JWT; сам по себе НЕ даёт права доступа к API. */
async function getSessionBinding(initData: string, accessToken: string): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify([initData, accessToken]));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

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
  let initRequest: Promise<void> | null = null;
  let sessionGeneration = 0;

  const isAuthenticated = computed(() => !!token.value);
  const trustedContactReady = computed(() => user.value?.trusted_contact_ready ?? false);
  const requiresTelegramWriteAccess = computed(
    () => Boolean(tg?.initData) && (!isAuthenticated.value || !telegramWriteAccess.value),
  );
  const canUseApp = computed(
    () =>
      !['authenticating', 'auth_error', 'reopen_required'].includes(writeAccessState.value) &&
      !requiresTelegramWriteAccess.value,
  );
  const navigation = computed<MiniappNavigationItem[]>(() => {
    return user.value?.navigation ?? DEFAULT_USER_NAVIGATION;
  });

  /** Удаляет локальную сессию, не меняя серверные правила проверки JWT/initData. */
  function clearSession() {
    const storedToken = localStorage.getItem('access_token');
    if (!storedToken || storedToken === token.value) {
      localStorage.removeItem('access_token');
      localStorage.removeItem(TELEGRAM_SESSION_BINDING_KEY);
    }
    token.value = null;
    user.value = null;
    isNewUser.value = false;
    telegramWriteAccess.value = false;
    nativeWriteAccessGranted.value = false;
  }

  /** Восстанавливает только тот же запуск; новый initData проверяется backend заново. */
  async function initializeSession() {
    const generation = sessionGeneration;
    writeAccessState.value = 'authenticating';
    ready.value = false;
    user.value = null;
    telegramWriteAccess.value = false;
    try {
      token.value = localStorage.getItem('access_token');
      if (tg?.initData) {
        const binding = token.value ? await getSessionBinding(tg.initData, token.value) : null;
        if (generation !== sessionGeneration) return;
        if (binding && binding === localStorage.getItem(TELEGRAM_SESSION_BINDING_KEY)) {
          // Browser storage — лишь подсказка. Доступ открывает только успешный /me.
          await fetchUser(generation);
        } else {
          clearSession();
          await login(tg.initData, generation);
        }
      } else if (token.value) {
        await fetchUser(generation);
      } else {
        setGuestUser();
        writeAccessState.value = 'idle';
      }
    } catch (error) {
      if (generation !== sessionGeneration) return;
      const rejected = isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0);
      if (rejected) {
        clearSession();
      }
      // Сетевой сбой не отзывает JWT, но неподтверждённый профиль недоступен.
      user.value = null;
      telegramWriteAccess.value = false;
      writeAccessState.value = rejected && tg?.initData ? 'reopen_required' : 'auth_error';
    } finally {
      if (generation === sessionGeneration) ready.value = true;
    }
  }

  /** Объединяет boot и повторные клики, не потребляя одноразовый initData параллельно. */
  async function init() {
    if (writeAccessState.value === 'reopen_required') return;
    if (initRequest) return initRequest;
    initRequest = initializeSession();
    try {
      await initRequest;
    } finally {
      initRequest = null;
    }
  }

  /** Сохраняет привязку сразу после выдачи JWT, до потенциального сбоя загрузки профиля. */
  async function login(initData: string, generation = sessionGeneration) {
    const response = await api.post<TelegramAuthResponse>('/api/auth/telegram', {
      init_data: initData,
    });
    if (generation !== sessionGeneration) return;
    const accessToken = response.data.access_token;
    const binding = await getSessionBinding(initData, accessToken);
    if (generation !== sessionGeneration) return;
    token.value = accessToken;
    isNewUser.value = response.data.is_new_user;
    localStorage.setItem('access_token', token.value);
    localStorage.setItem(TELEGRAM_SESSION_BINDING_KEY, binding);
    await fetchUser(generation);
  }

  /** Получает профиль и разрешения только через серверную проверку bearer-токена. */
  async function fetchUser(generation = sessionGeneration) {
    const accessToken = token.value;
    if (!accessToken) throw new Error('Session unavailable');
    const response = await api.get<MiniappUser>('/api/users/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (generation !== sessionGeneration) return;
    // Не смешиваем профиль одного аккаунта с bearer-токеном из другой вкладки.
    if (localStorage.getItem('access_token') !== accessToken) throw new Error('Session changed');
    user.value = response.data;
    telegramWriteAccess.value = response.data.telegram_write_access;
    writeAccessState.value = telegramWriteAccess.value ? 'allowed' : 'idle';
    setAppLocale(user.value.language_code ?? tg?.initDataUnsafe?.user?.language_code ?? 'ru');
  }

  /** Подтверждает разрешение сервером; отказ auth требует нового Telegram-запуска. */
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
    } catch (error) {
      if (isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0)) {
        clearSession();
        writeAccessState.value = 'reopen_required';
        return;
      }
      writeAccessState.value =
        status === 'allowed' ? 'sync_error' : status === 'unsupported' ? 'unsupported' : 'denied';
    }
  }

  /** Разделяет native-разрешение и его сохранение, чтобы retry не открывал второй popup. */
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

  /** Запрашивает разрешение только после успешной аутентификации. */
  async function requestTelegramWriteAccess() {
    if (
      !isAuthenticated.value ||
      ['authenticating', 'auth_error', 'reopen_required'].includes(writeAccessState.value)
    )
      return;
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

  /** Сохраняет доверенный телефон текущего пользователя через защищённый API. */
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

  /** Завершает локальную сессию и удаляет отпечаток запуска. */
  function logout() {
    sessionGeneration += 1;
    clearSession();
    ready.value = true;
    writeAccessState.value = tg?.initData ? 'reopen_required' : 'idle';
  }

  /** Создаёт только browser/dev-представление; не заменяет ошибку Telegram auth. */
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
