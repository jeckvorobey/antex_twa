import { describe, expect, it } from 'vitest';

import {
  getTelegramUserInitials,
  hasTelegramLaunchParams,
  resolveBackRouteName,
} from '@utils/telegram';

describe('Telegram Mini App helpers', () => {
  it('detects official Telegram launch params without treating an ordinary URL as Telegram', () => {
    expect(
      hasTelegramLaunchParams(
        'https://example.com/#tgWebAppData=query_id%3D1&tgWebAppVersion=9.6&tgWebAppPlatform=android',
      ),
    ).toBe(true);
    expect(
      hasTelegramLaunchParams(
        'https://example.com/?tgWebAppVersion=9.6&tgWebAppPlatform=android#/profile',
      ),
    ).toBe(true);
    expect(hasTelegramLaunchParams('http://localhost:5173/#/profile')).toBe(false);
  });

  it('resolves only non-empty named parent routes', () => {
    expect(resolveBackRouteName({ backRouteName: 'profile' })).toBe('profile');
    expect(resolveBackRouteName({ backRouteName: '  ' })).toBeNull();
    expect(resolveBackRouteName({ backRouteName: 1 })).toBeNull();
  });

  it('builds stable Telegram initials from names, username and empty user', () => {
    expect(getTelegramUserInitials({ first_name: 'Иван', last_name: 'Петров' })).toBe('ИП');
    expect(getTelegramUserInitials({ username: 'antex_user' })).toBe('A');
    expect(getTelegramUserInitials()).toBe('A');
  });
});
