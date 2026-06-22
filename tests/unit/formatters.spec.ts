import { describe, expect, it } from 'vitest';

import {
  formatAmount,
  formatReadableNumber,
  formatMiniappDateTime,
  formatMiniappTime,
  parseReadableNumber,
  resolveDateLocale,
} from '@utils/formatters';

describe('formatters', () => {
  it('formats miniapp card datetime in stable day-month-year order', () => {
    expect(formatMiniappDateTime('2026-03-28T09:30:00+00:00', 'ru')).toBe('28.03.2026 09:30');
  });

  it('formats grouped history time without locale drift', () => {
    expect(formatMiniappTime('2026-03-28T10:42:00+00:00', 'ru')).toBe('10:42');
  });

  it('formats amounts with thousand separators and compact decimals', () => {
    expect(formatAmount(5000)).toBe('5 000');
    expect(formatAmount(13500)).toBe('13 500');
    expect(formatAmount(55.56)).toBe('55,56');
  });

  it('formats numeric strings for readable frontend output', () => {
    expect(formatReadableNumber('1770750')).toBe('1 770 750');
    expect(formatReadableNumber('25500.00')).toBe('25 500');
    expect(formatReadableNumber('354.15')).toBe('354,15');
  });

  it('parses grouped strings back into numbers for input fields', () => {
    expect(parseReadableNumber('1 770 750')).toBe(1770750);
    expect(parseReadableNumber('55,56')).toBe(55.56);
    expect(parseReadableNumber('')).toBeNull();
  });

  it('falls back to stable locale values', () => {
    expect(resolveDateLocale('ru-RU')).toBe('ru-RU');
    expect(resolveDateLocale('en-US')).toBe('en-US');
    expect(resolveDateLocale(undefined)).toBe('ru-RU');
  });
});
