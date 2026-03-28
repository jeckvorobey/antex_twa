import { describe, expect, it } from 'vitest';

import ru from '@i18n/ru';
import { normalizeLocale } from '@i18n';

describe('i18n', () => {
  it('falls back to ru locale', () => {
    expect(normalizeLocale('en-US')).toBe('ru');
    expect(normalizeLocale('ru-RU')).toBe('ru');
    expect(normalizeLocale(undefined)).toBe('ru');
  });

  it('contains required ru namespaces', () => {
    expect(ru.nav.home).toBeTruthy();
    expect(ru.order.contact).toBeTruthy();
    expect(ru.order.contactPlaceholder).toBe('@telegram');
    expect(ru.common.notifications).toBeTruthy();
    expect(ru.errors.generic).toBeTruthy();
  });
});
