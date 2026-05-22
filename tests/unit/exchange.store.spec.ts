import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useExchangeStore } from '@stores/exchange.store';
import type { MiniappCity, MiniappExchangeScreenResponse, MiniappQuoteResponse } from '@types/miniapp';

vi.mock('@services/api/miniapp.service', () => ({
  createOrder: vi.fn(),
  fetchCities: vi.fn(),
  fetchExchangeScreen: vi.fn(),
}));

import { fetchCities, fetchExchangeScreen } from '@services/api/miniapp.service';

function makeQuote(params: {
  currencySell: string;
  currencyBuy: string;
  amountSell: number;
  amountBuy: number;
  rate?: number;
}): MiniappQuoteResponse {
  return {
    ...params,
    rate: params.rate ?? 0.4,
    rateDisplay: (params.rate ?? 0.4).toFixed(2),
    rateText: `1 ${params.currencySell} = ${(params.rate ?? 0.4).toFixed(2)} ${params.currencyBuy}`,
    updatedAt: '2026-03-28T12:00:00+00:00',
    availableMethods: ['qrcode', 'cash'],
  };
}

function makeScreen(): MiniappExchangeScreenResponse {
  return {
    calculator: { fromCurrency: 'RUB', toCurrency: 'THB', amountSell: 5000 },
    chips: ['USDT', 'THB', 'RUB', 'GEL', 'VND'],
    pairs: [
      {
        id: 'rub-thb',
        label: 'RUB/THB',
        country: 'thailand',
        countryLabel: 'Таиланд',
        fromCurrency: 'RUB',
        toCurrency: 'THB',
        rate: 2.51,
        calculationRate: 0.4,
        rateDisplay: '2.51',
        rateText: '1 THB = 2.51 RUB',
        amountSellExample: 5000,
        amountBuyExample: 2000,
        updatedAt: '2026-03-28T12:00:00+00:00',
        availableMethods: ['qrcode', 'cash'],
      },
      {
        id: 'rub-gel',
        label: 'RUB/GEL',
        country: 'georgia',
        countryLabel: 'Грузия',
        fromCurrency: 'RUB',
        toCurrency: 'GEL',
        rate: 34.36,
        calculationRate: 0.03,
        rateDisplay: '34.36',
        rateText: '1 GEL = 34.36 RUB',
        amountSellExample: 5000,
        amountBuyExample: 150,
        updatedAt: '2026-03-28T12:00:00+00:00',
        availableMethods: ['qrcode', 'cash'],
      },
    ],
    quote: makeQuote({
      currencySell: 'RUB',
      currencyBuy: 'THB',
      amountSell: 5000,
      amountBuy: 2000,
    }),
  };
}

function makeCities(): MiniappCity[] {
  return [
    {
      id: 1,
      name: 'Bangkok',
      country: 'thailand',
      countryRuName: 'Таиланд',
      countryCode: 'th',
      countryFlag: '🇹🇭',
      createdAt: '2026-03-28T12:00:00+00:00',
      updatedAt: '2026-03-28T12:00:00+00:00',
    },
  ];
}

describe('exchange store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('recalculates preliminary quote locally without backend quote request', async () => {
    const store = useExchangeStore();
    vi.mocked(fetchExchangeScreen).mockResolvedValue(makeScreen());
    vi.mocked(fetchCities).mockResolvedValue({ items: makeCities() });

    await store.load();

    const quote = store.recalculateQuote({
      currencySell: 'RUB',
      currencyBuy: 'THB',
      amountSell: 6000,
    });

    expect(quote?.amountSell).toBe(6000);
    expect(store.quote?.amountBuy).toBe(2400);
  });

  it('loads cities together with backend-driven exchange screen', async () => {
    const store = useExchangeStore();
    vi.mocked(fetchExchangeScreen).mockResolvedValue(makeScreen());
    vi.mocked(fetchCities).mockResolvedValue({ items: makeCities() });

    await store.load();

    expect(store.screen?.chips).toEqual(['USDT', 'THB', 'RUB', 'GEL', 'VND']);
    expect(store.cities[0]?.name).toBe('Bangkok');
  });

  it('clears quote when local pair is missing', async () => {
    const store = useExchangeStore();
    vi.mocked(fetchExchangeScreen).mockResolvedValue(makeScreen());
    vi.mocked(fetchCities).mockResolvedValue({ items: makeCities() });

    await store.load();

    store.recalculateQuote({
      currencySell: 'USDT',
      currencyBuy: 'THB',
      amountSell: 100,
    });

    expect(store.quote).toBeNull();
  });
});
