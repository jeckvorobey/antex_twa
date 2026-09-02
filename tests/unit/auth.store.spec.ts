import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@boot/axios', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock('@boot/telegram', () => ({
  tg: {
    initData: 'fresh-init-data',
    initDataUnsafe: {
      user: {
        id: 123456,
        username: 'fresh_user',
        first_name: 'Fresh',
        last_name: 'User',
        language_code: 'ru',
        is_premium: true,
        photo_url: 'https://t.me/i/userpic/320/fresh.jpg',
      },
    },
    ready: vi.fn(),
    expand: vi.fn(),
    close: vi.fn(),
    requestWriteAccess: vi.fn(),
    MainButton: {
      show: vi.fn(),
      hide: vi.fn(),
      setText: vi.fn(),
      onClick: vi.fn(),
    },
  },
}));

vi.mock('@i18n', () => ({
  setAppLocale: vi.fn(),
}));

import { api } from '@boot/axios';
import { tg } from '@boot/telegram';
import { setAppLocale } from '@i18n';
import { useAuthStore } from '@stores/auth.store';

const requestWriteAccessMock = vi.mocked(tg!.requestWriteAccess!);

describe('auth store', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
    vi.clearAllMocks();
    tg!.initData = 'fresh-init-data';
    tg!.requestWriteAccess = requestWriteAccessMock;
    requestWriteAccessMock.mockReset();
  });

  it('отправляет свежий initData при повторном открытии miniapp даже если token уже сохранён', async () => {
    localStorage.setItem('access_token', 'stale-token');
    vi.mocked(api.post).mockResolvedValue({
      data: {
        access_token: 'fresh-token',
        token_type: 'bearer',
        is_new_user: true,
        telegram_write_access: false,
      },
    });
    vi.mocked(api.get).mockResolvedValue({
      data: {
        id: 1,
        username: 'fresh_user',
        phone: null,
        first_name: 'Fresh',
        last_name: 'User',
        language_code: 'ru',
        photo_url: 'https://t.me/i/userpic/320/fresh.jpg',
        is_bot: false,
        is_premium: true,
        telegram_write_access: false,
        role: 9,
        trusted_contact: 'fresh_user',
        trusted_contact_source: 'username',
        trusted_contact_ready: true,
      },
    });

    const store = useAuthStore();
    await store.init();

    expect(api.post).toHaveBeenCalledWith('/api/auth/telegram', {
      init_data: 'fresh-init-data',
    });
    expect(api.get).toHaveBeenCalledWith('/api/users/me', {
      headers: { Authorization: 'Bearer fresh-token' },
    });
    expect(localStorage.getItem('access_token')).toBe('fresh-token');
    expect(store.user?.username).toBe('fresh_user');
    expect(store.navigation.map((item) => item.name)).toEqual([
      'home',
      'exchange',
      'history',
      'profile',
    ]);
    expect(store.trustedContactReady).toBe(true);
    expect(setAppLocale).toHaveBeenCalledWith('ru');
  });

  it('сохраняет trusted phone через auth seam и обновляет readiness локально', async () => {
    vi.mocked(api.put).mockResolvedValue({
      data: {
        ready: true,
        contact: '+79991234567',
        source: 'phone',
        phone: '+79991234567',
        username: null,
      },
    });

    const store = useAuthStore();
    store.user = {
      id: 1,
      username: null,
      phone: null,
      first_name: 'Fresh',
      last_name: 'User',
      language_code: 'ru',
      photo_url: null,
      is_bot: false,
      is_premium: true,
      telegram_write_access: false,
      role: 9,
      trusted_contact: null,
      trusted_contact_source: null,
      trusted_contact_ready: false,
    };

    await store.saveTrustedPhone('+79991234567');

    expect(api.put).toHaveBeenCalledWith('/api/auth/contact', { phone: '+79991234567' });
    expect(store.user?.phone).toBe('+79991234567');
    expect(store.user?.trusted_contact).toBe('+79991234567');
    expect(store.trustedContactReady).toBe(true);
  });

  it('строит guest user из telegram user id без hardcoded 9999001', async () => {
    vi.mocked(api.get).mockReset();
    vi.mocked(api.post).mockReset();
    (tg as typeof tg & { initData?: string }).initData = undefined;

    const store = useAuthStore();
    await store.init();

    expect(api.post).not.toHaveBeenCalled();
    expect(api.get).not.toHaveBeenCalled();
    expect(store.user?.id).toBe(123456);
    expect(store.user?.role).toBe(9);
    expect(store.user?.username).toBe('fresh_user');
    expect(store.user?.first_name).toBe('Fresh');
    expect(store.user?.photo_url).toBe('https://t.me/i/userpic/320/fresh.jpg');
    expect(store.user?.trusted_contact).toBe('fresh_user');
    expect(store.trustedContactReady).toBe(true);
    expect(store.user?.id).not.toBe(9_999_001);
  });

  it('не открывает native popup при сохранённом write access', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: {
        access_token: 'cached-token',
        token_type: 'bearer',
        is_new_user: false,
        telegram_write_access: true,
      },
    });
    vi.mocked(api.get).mockResolvedValue({
      data: {
        id: 1,
        username: 'cached',
        phone: null,
        first_name: 'Cached',
        last_name: null,
        language_code: 'ru',
        photo_url: null,
        is_bot: false,
        is_premium: false,
        telegram_write_access: true,
        role: 9,
        trusted_contact: 'cached',
        trusted_contact_source: 'username',
        trusted_contact_ready: true,
      },
    });

    const store = useAuthStore();
    await store.init();
    await store.requestTelegramWriteAccess();

    expect(tg?.requestWriteAccess).not.toHaveBeenCalled();
    expect(store.canUseApp).toBe(true);
  });

  it('сохраняет allowed и открывает приложение только после backend sync', async () => {
    vi.mocked(tg?.requestWriteAccess).mockImplementation((callback) => callback(true));
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { telegram_write_access: true },
    });
    const store = useAuthStore();
    store.token = 'token';
    store.telegramWriteAccess = false;

    await store.requestTelegramWriteAccess();

    expect(api.post).toHaveBeenCalledWith('/api/users/me/telegram-write-access', {
      status: 'allowed',
    });
    expect(store.telegramWriteAccess).toBe(true);
    expect(store.canUseApp).toBe(true);
    expect(store.writeAccessState).toBe('allowed');
  });

  it('оставляет приложение заблокированным после отказа', async () => {
    vi.mocked(tg?.requestWriteAccess).mockImplementation((callback) => callback(false));
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { telegram_write_access: false },
    });
    const store = useAuthStore();
    store.token = 'token';

    await store.requestTelegramWriteAccess();

    expect(api.post).toHaveBeenCalledWith('/api/users/me/telegram-write-access', {
      status: 'cancelled',
    });
    expect(store.canUseApp).toBe(false);
    expect(store.writeAccessState).toBe('denied');
  });

  it('фиксирует unsupported без открытия приложения', async () => {
    if (tg) {
      tg.requestWriteAccess = undefined;
    }
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { telegram_write_access: false },
    });
    const store = useAuthStore();
    store.token = 'token';

    await store.requestTelegramWriteAccess();

    expect(api.post).toHaveBeenCalledWith('/api/users/me/telegram-write-access', {
      status: 'unsupported',
    });
    expect(store.canUseApp).toBe(false);
    expect(store.writeAccessState).toBe('unsupported');
  });

  it('после allowed повторяет только backend sync без второго popup', async () => {
    vi.mocked(tg?.requestWriteAccess).mockImplementation((callback) => callback(true));
    vi.mocked(api.post)
      .mockRejectedValueOnce(new Error('backend unavailable'))
      .mockResolvedValueOnce({ data: { telegram_write_access: true } });
    const store = useAuthStore();
    store.token = 'token';

    await store.requestTelegramWriteAccess();
    expect(store.writeAccessState).toBe('sync_error');

    await store.requestTelegramWriteAccess();

    expect(tg?.requestWriteAccess).toHaveBeenCalledTimes(1);
    expect(api.post).toHaveBeenCalledTimes(2);
    expect(store.telegramWriteAccess).toBe(true);
    expect(store.writeAccessState).toBe('allowed');
  });

  it('не разблокирует Telegram flow через guest fallback при ошибке auth', async () => {
    vi.mocked(api.post).mockRejectedValueOnce(new Error('invalid initData'));
    const store = useAuthStore();

    await store.init();

    expect(store.user).toBeNull();
    expect(store.canUseApp).toBe(false);
    expect(store.writeAccessState).toBe('auth_error');
  });
});
