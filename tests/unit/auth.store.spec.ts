import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@boot/axios', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
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
        first_name: 'Fresh',
        last_name: 'User',
        language_code: 'ru',
        is_bot: false,
        is_premium: true,
        role: 9,
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
    expect(setAppLocale).toHaveBeenCalledWith('ru');
  });
});
