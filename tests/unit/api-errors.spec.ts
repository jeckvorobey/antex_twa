import { describe, expect, it } from 'vitest';

import { getMiniappErrorMessageKey } from '@utils/api-errors';

describe('miniapp api errors', () => {
  it('maps backend codes to localized error keys only', () => {
    expect(getMiniappErrorMessageKey('RATE_UNAVAILABLE')).toBe('errors.rate_unavailable');
    expect(getMiniappErrorMessageKey('UNSUPPORTED_PAIR')).toBe('errors.unsupported_pair');
    expect(getMiniappErrorMessageKey('CITY_MANAGER_NOT_CONFIGURED')).toBe(
      'errors.city_manager_missing',
    );
    expect(getMiniappErrorMessageKey('ORDER_ALREADY_EXISTS')).toBe('errors.order_exists');
  });

  it('falls back to generic key for unknown or missing codes', () => {
    expect(getMiniappErrorMessageKey('UNKNOWN')).toBe('errors.generic');
    expect(getMiniappErrorMessageKey()).toBe('errors.generic');
  });
});
