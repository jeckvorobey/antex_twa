import { AxiosError, type AxiosAdapter } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@boot/axios';

const originalAdapter = api.defaults.adapter;

beforeEach(() => {
  localStorage.clear();
});
afterEach(() => {
  if (originalAdapter === undefined) {
    delete api.defaults.adapter;
  } else {
    api.defaults.adapter = originalAdapter;
  }
});

describe('bearer для проверки сессии', () => {
  it('не заменяет явно выбранный JWT токеном другой вкладки', async () => {
    localStorage.setItem('access_token', 'other-tab-token');
    const adapter = vi.fn<AxiosAdapter>(async (config) => {
      return { data: null, status: 200, statusText: 'OK', headers: {}, config };
    });
    api.defaults.adapter = adapter;
    await api.get('/api/users/me', { headers: { Authorization: 'Bearer session-token' } });
    expect(adapter.mock.calls[0]![0].headers.Authorization).toBe('Bearer session-token');
  });

  it.each([true, false])(
    '401 удаляет только токен отклонённого запроса (токен заменён: %s)',
    async (replaced) => {
      localStorage.setItem('access_token', 'request-token');
      api.defaults.adapter = async (config) => {
        if (replaced) localStorage.setItem('access_token', 'new-token');
        throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, {
          data: null,
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config,
        });
      };
      await expect(api.get('/api/users/me')).rejects.toBeInstanceOf(AxiosError);
      expect(localStorage.getItem('access_token')).toBe(replaced ? 'new-token' : null);
    },
  );
});
