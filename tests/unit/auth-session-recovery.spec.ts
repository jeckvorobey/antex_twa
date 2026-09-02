import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@boot/axios', () => ({ api: { get: vi.fn(), post: vi.fn() } }));
vi.mock('@boot/telegram', () => ({
  tg: { initData: 'launch-one', initDataUnsafe: {}, requestWriteAccess: vi.fn() },
}));
vi.mock('@i18n', () => ({ setAppLocale: vi.fn() }));

import { api } from '@boot/axios';
import { tg } from '@boot/telegram';
import { useAuthStore } from '@stores/auth.store';

const profile = {
  id: 7,
  username: 'test',
  phone: null,
  first_name: 'Test',
  last_name: null,
  language_code: 'ru',
  photo_url: null,
  is_bot: false,
  is_premium: false,
  telegram_write_access: true,
  role: 9,
  trusted_contact: 'test',
  trusted_contact_source: 'username',
  trusted_contact_ready: true,
};

/** Создаёт транспортную ошибку без настоящих пользовательских данных. */
function httpError(status: number, code = 'TEST_ERROR') {
  return { isAxiosError: true, response: { status, data: { code } } };
}

/** Имитирует перезагрузку страницы, сохраняя только browser storage. */
function reloadStore() {
  setActivePinia(createPinia());
  return useAuthStore();
}

beforeEach(() => {
  localStorage.clear();
  vi.resetAllMocks();
  tg!.initData = 'launch-one';
  setActivePinia(createPinia());
  const consumed = new Set<string>();
  vi.mocked(api.post).mockImplementation(async (_url, body) => {
    const { init_data } = body as { init_data: string };
    if (consumed.has(init_data)) throw httpError(401, 'INIT_DATA_REPLAYED');
    consumed.add(init_data);
    return {
      data: {
        access_token: `test-token-${init_data}`,
        is_new_user: false,
        token_type: 'bearer',
        telegram_write_access: true,
      },
    };
  });
  vi.mocked(api.get).mockResolvedValue({ data: profile });
});

describe('безопасное восстановление Telegram-сессии', () => {
  it('после reload проверяет JWT сервером без повторного потребления initData', async () => {
    await useAuthStore().init();
    const store = reloadStore();
    await store.init();

    expect(store.canUseApp).toBe(true);
    expect(store.user?.id).toBe(7);
    expect(api.post).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledTimes(2);
  });

  it.each([undefined, 429, 500, 503])(
    'сохраняет JWT при временном сбое %s и восстанавливается по retry',
    async (status) => {
      await useAuthStore().init();
      const store = reloadStore();
      vi.mocked(api.get).mockRejectedValueOnce(status ? httpError(status) : new Error('offline'));
      await store.init();
      expect(store.canUseApp).toBe(false);
      expect(store.user).toBeNull();
      expect(store.writeAccessState).toBe('auth_error');
      expect(localStorage.getItem('access_token')).toBe('test-token-launch-one');

      await store.init();
      expect(store.canUseApp).toBe(true);
      expect(api.post).toHaveBeenCalledTimes(1);
    },
  );

  it('сохраняет полученный JWT, если загрузка профиля после login оборвалась', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error('offline'));
    await useAuthStore().init();
    const store = reloadStore();
    await store.init();
    expect(store.canUseApp).toBe(true);
    expect(api.post).toHaveBeenCalledTimes(1);
  });

  it.each([401, 403])(
    'отклонённый сервером JWT (%s) не открывает приложение и требует нового запуска',
    async (status) => {
      await useAuthStore().init();
      const store = reloadStore();
      vi.mocked(api.get).mockRejectedValueOnce(httpError(status));
      await store.init();
      expect(store.canUseApp).toBe(false);
      expect(store.user).toBeNull();
      expect(store.token).toBeNull();
      expect(localStorage.getItem('access_token')).toBeNull();
      expect(store.writeAccessState).toBe('reopen_required');
      await store.init();
      expect(api.post).toHaveBeenCalledTimes(1);
    },
  );

  it('новый запуск не восстанавливает токен предыдущего аккаунта при отказе auth', async () => {
    await useAuthStore().init();
    tg!.initData = 'different-account-launch';
    const store = reloadStore();
    vi.mocked(api.post).mockRejectedValueOnce(httpError(401, 'INVALID_INIT_DATA'));
    await store.init();
    expect(store.canUseApp).toBe(false);
    expect(store.user).toBeNull();
    expect(store.token).toBeNull();
    expect(api.get).toHaveBeenCalledTimes(1);
  });

  it('новый запуск проходит новый login для доверенной referral/marketing attribution', async () => {
    await useAuthStore().init();
    tg!.initData = 'launch-two';
    const store = reloadStore();
    await store.init();
    expect(store.token).toBe('test-token-launch-two');
    expect(store.canUseApp).toBe(true);
    expect(api.post).toHaveBeenCalledTimes(2);
  });

  it('замена токена в storage не переиспользует привязку предыдущего токена', async () => {
    await useAuthStore().init();
    localStorage.setItem('access_token', 'foreign-token');
    const store = reloadStore();
    await store.init();
    expect(store.canUseApp).toBe(false);
    expect(store.user).toBeNull();
    expect(api.get).toHaveBeenCalledTimes(1);
  });

  it('объединяет одновременные init в один запрос и блокирует доступ до ответа', async () => {
    const store = useAuthStore();
    await Promise.all([store.init(), store.init(), store.init()]);
    expect(store.canUseApp).toBe(true);
    expect(api.post).toHaveBeenCalledTimes(1);
  });

  it('повторный init не оставляет прежний профиль доступным во время проверки', async () => {
    const store = useAuthStore();
    await store.init();
    const retry = store.init();
    expect(store.canUseApp).toBe(false);
    expect(store.writeAccessState).toBe('authenticating');
    await retry;
    expect(store.canUseApp).toBe(true);
  });

  it('replay без токена предлагает новый запуск, а не бесконечный retry', async () => {
    vi.mocked(api.post).mockRejectedValueOnce(httpError(401, 'INIT_DATA_REPLAYED'));
    const store = useAuthStore();
    await store.init();
    await store.init();
    expect(store.writeAccessState).toBe('reopen_required');
    expect(store.canUseApp).toBe(false);
    expect(api.post).toHaveBeenCalledTimes(1);
  });

  it('retry после восстановления write access=false выходит из auth_error в запрос разрешения', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { ...profile, telegram_write_access: false } });
    const store = useAuthStore();
    vi.mocked(api.get).mockRejectedValueOnce(new Error('offline'));
    await store.init();
    await store.init();
    expect(store.writeAccessState).toBe('idle');
    expect(store.canUseApp).toBe(false);
    expect(api.post).toHaveBeenCalledTimes(1);
  });

  it('запоздавший профиль после logout не восстанавливает доступ', async () => {
    let finish!: (value: unknown) => void;
    vi.mocked(api.get).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const store = useAuthStore();
    const pending = store.init();
    await vi.waitFor(() => expect(api.get).toHaveBeenCalledOnce());
    store.logout();
    finish({ data: profile });
    await pending;
    expect(store.user).toBeNull();
    expect(store.token).toBeNull();
    expect(store.canUseApp).toBe(false);
  });

  it('запоздавший login после logout не сохраняет новый JWT', async () => {
    let finish!: (value: unknown) => void;
    vi.mocked(api.post).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const store = useAuthStore();
    const pending = store.init();
    store.logout();
    finish({
      data: {
        access_token: 'late-token',
        token_type: 'bearer',
        is_new_user: false,
        telegram_write_access: true,
      },
    });
    await pending;
    expect(store.user).toBeNull();
    expect(store.token).toBeNull();
    expect(localStorage.getItem('access_token')).toBeNull();
  });

  it('смена токена другой вкладкой во время /me не открывает прежний профиль', async () => {
    await useAuthStore().init();
    const store = reloadStore();
    vi.mocked(api.get).mockImplementationOnce(async () => {
      localStorage.setItem('access_token', 'other-tab-token');
      return { data: profile };
    });
    await store.init();
    expect(store.user).toBeNull();
    expect(store.canUseApp).toBe(false);
    expect(api.get).toHaveBeenLastCalledWith('/api/users/me', {
      headers: { Authorization: 'Bearer test-token-launch-one' },
    });
  });

  it('не запрашивает write access без подтверждённой сессии', async () => {
    vi.mocked(tg!.requestWriteAccess!).mockImplementation((callback) => callback(false));
    const store = useAuthStore();
    vi.mocked(api.post).mockRejectedValueOnce(new Error('offline'));
    await store.init();
    await store.requestTelegramWriteAccess();
    expect(tg?.requestWriteAccess).not.toHaveBeenCalled();
    expect(store.writeAccessState).toBe('auth_error');
  });

  it.each([401, 403])(
    'истечение сессии при записи write access (%s) требует нового запуска',
    async (status) => {
      vi.mocked(api.get).mockResolvedValue({ data: { ...profile, telegram_write_access: false } });
      vi.mocked(tg!.requestWriteAccess!).mockImplementation((callback) => callback(true));
      const store = useAuthStore();
      await store.init();
      vi.mocked(api.post).mockRejectedValueOnce(httpError(status));
      await store.requestTelegramWriteAccess();
      expect(store.writeAccessState).toBe('reopen_required');
      expect(store.token).toBeNull();
      expect(store.canUseApp).toBe(false);
      await store.requestTelegramWriteAccess();
      expect(api.post).toHaveBeenCalledTimes(2);
    },
  );

  it('запоздавший 401 восстановления не удаляет токен новой сессии в storage', async () => {
    await useAuthStore().init();
    const store = reloadStore();
    vi.mocked(api.get).mockImplementationOnce(async () => {
      localStorage.setItem('access_token', 'new-tab-token');
      throw httpError(401);
    });
    await store.init();
    expect(store.canUseApp).toBe(false);
    expect(localStorage.getItem('access_token')).toBe('new-tab-token');
  });
});
