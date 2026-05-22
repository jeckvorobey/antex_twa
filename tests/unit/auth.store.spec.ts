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
      },
    },
    ready: vi.fn(),
    expand: vi.fn(),
    close: vi.fn(),
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

describe('auth store', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('отправляет свежий initData при повторном открытии miniapp даже если token уже сохранён', async () => {
    localStorage.setItem('access_token', 'stale-token');
    vi.mocked(api.post).mockResolvedValue({
      data: { access_token: 'fresh-token' },
    });
    vi.mocked(api.get).mockResolvedValue({
      data: {
        id: 1,
        username: 'fresh_user',
        phone: null,
        first_name: 'Fresh',
        last_name: 'User',
        language_code: 'ru',
        is_bot: false,
        is_premium: true,
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
    expect(api.get).toHaveBeenCalledWith('/api/users/me');
    expect(localStorage.getItem('access_token')).toBe('fresh-token');
    expect(store.user?.username).toBe('fresh_user');
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
      is_bot: false,
      is_premium: true,
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
    expect(store.user?.trusted_contact).toBe('fresh_user');
    expect(store.trustedContactReady).toBe(true);
    expect(store.user?.id).not.toBe(9_999_001);
  });
});
