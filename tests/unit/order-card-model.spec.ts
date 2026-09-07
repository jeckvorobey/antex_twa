import { describe, expect, it } from 'vitest';

import { toManagerOrderCard, toUserOrderCard } from '@components/orders/order-card.adapters';
import type { ManagerOrderSummary } from '@types/manager-chat';
import type { MiniappOrderItem } from '@types/miniapp';

const messages: Record<string, string> = {
  'manager.countries.thailand': 'Таиланд',
  'manager.receiveMethods.cash': 'Наличные',
  'manager.customerFallback': 'Клиент #77',
};
const t = (key: string) => messages[key] ?? key;
const te = (key: string) => key in messages;

const baseUser: MiniappOrderItem = {
  id: 12,
  publicNumber: '2026080124',
  cityId: 5,
  country: 'thailand',
  currencySell: 'RUB',
  amountSell: 25_000,
  currencyBuy: 'THB',
  amountBuy: 9_237.35,
  rate: 2.71,
  rateDisplay: '2.71',
  rateText: '1 THB = 2.71 RUB',
  status: 3,
  methodGet: 'cash',
  contactTelegram: null,
  createdAt: '2026-08-19T20:34:00Z',
  updatedAt: '2026-08-19T20:34:00Z',
  city: {
    id: 5,
    name: 'Паттайя',
    country: 'thailand',
    countryRuName: 'Таиланд',
    countryCode: 'th',
    countryFlag: '🇹🇭',
  },
};

describe('OrderCard adapters', () => {
  it('normalizes a customer DTO without mutating it', () => {
    const input = structuredClone(baseUser);
    const before = structuredClone(input);

    const result = toUserOrderCard(input, 'ru', t, te);

    expect(result).toMatchObject({
      id: 12,
      publicNumber: '2026080124',
      statusLabelKey: 'status.completed',
      statusTone: 'positive',
      location: 'Таиланд · Паттайя',
      method: 'Наличные',
      createdAt: '20:34',
      customerName: null,
    });
    expect(input).toEqual(before);
  });

  it('normalizes manager identity and omits an empty city separator', () => {
    const order: ManagerOrderSummary = {
      ...baseUser,
      city: null,
      user: {
        id: 77,
        telegramId: 900_077,
        username: 'not-a-display-name',
        firstName: null,
        lastName: null,
        photoUrl: null,
      },
    };

    const result = toManagerOrderCard(order, 'ru', t, te);

    expect(result.location).toBe('Таиланд');
    expect(result.customerName).toBe('Клиент #77');
    expect(result.method).toBe('Наличные');
    expect(result.statusLabelKey).toBe('status.completed');
  });

  it.each([
    [1, 'status.new', 'warning'],
    [2, 'status.processing', 'info'],
    [3, 'status.completed', 'positive'],
    [4, 'status.cancelled', 'negative'],
    [999, 'status.new', 'warning'],
  ] as const)('maps status %s to an accessible label and tone', (status, label, tone) => {
    const result = toUserOrderCard({ ...baseUser, status }, 'ru', t, te);
    expect([result.statusLabelKey, result.statusTone]).toEqual([label, tone]);
  });
});
