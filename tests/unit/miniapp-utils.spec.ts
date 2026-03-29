import { describe, expect, it } from 'vitest';

import {
  getStatusLabelKey,
  getStatusTone,
  groupOrdersByDate,
  isQuoteCurrent,
} from '@utils/miniapp';

describe('miniapp utils', () => {
  it('groups orders by localized date label', () => {
    const result = groupOrdersByDate([
      {
        id: 1,
        currencySell: 'RUB',
        amountSell: 5000,
        currencyBuy: 'THB',
        amountBuy: 13500,
        rate: 2.7,
        status: 1,
        methodGet: 'cash',
        contactTelegram: '@serg',
        createdAt: '2026-03-28T09:30:00+00:00',
        bank: { id: 1, code: 'SCB', name: 'Siam Commercial Bank' },
      },
      {
        id: 2,
        currencySell: 'USDT',
        amountSell: 150,
        currencyBuy: 'THB',
        amountBuy: 4950,
        rate: 33,
        status: 4,
        methodGet: 'cash',
        contactTelegram: '@serg',
        createdAt: '2026-03-28T10:30:00+00:00',
        bank: { id: 1, code: 'SCB', name: 'Siam Commercial Bank' },
      },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('28 марта 2026');
    expect(result[0].items).toHaveLength(2);
  });

  it('maps status keys and tones', () => {
    expect(getStatusLabelKey(4)).toBe('status.completed');
    expect(getStatusTone(4)).toBe('positive');
    expect(getStatusTone(99)).toBe('warning');
  });

  it('detects stale quote against current calculator values', () => {
    expect(
      isQuoteCurrent(
        {
          currencySell: 'RUB',
          currencyBuy: 'USDT',
          amountSell: 5000,
          amountBuy: 55.56,
          rate: 0.0111,
          rateText: 'stub',
          updatedAt: '2026-03-28T09:30:00+00:00',
          availableMethods: ['cash'],
        },
        {
          currencySell: 'RUB',
          currencyBuy: 'USDT',
          amountSell: 5000,
        },
      ),
    ).toBe(true);

    expect(
      isQuoteCurrent(
        {
          currencySell: 'RUB',
          currencyBuy: 'USDT',
          amountSell: 5000,
          amountBuy: 55.56,
          rate: 0.0111,
          rateText: 'stub',
          updatedAt: '2026-03-28T09:30:00+00:00',
          availableMethods: ['cash'],
        },
        {
          currencySell: 'RUB',
          currencyBuy: 'USDT',
          amountSell: 7000,
        },
      ),
    ).toBe(false);
  });
});
