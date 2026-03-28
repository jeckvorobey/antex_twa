import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useExchangeStore } from '@stores/exchange.store';
import type { MiniappQuoteResponse } from '@types/miniapp';

vi.mock('@services/api/miniapp.service', () => ({
  createOrder: vi.fn(),
  fetchExchangeScreen: vi.fn(),
  fetchQuote: vi.fn(),
}));

import { fetchQuote } from '@services/api/miniapp.service';

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((innerResolve, innerReject) => {
    resolve = innerResolve;
    reject = innerReject;
  });

  return { promise, resolve, reject };
}

function makeQuote(params: {
  currencySell: string;
  currencyBuy: string;
  amountSell: number;
  amountBuy: number;
}): MiniappQuoteResponse {
  return {
    ...params,
    rate: 1.5,
    rateText: 'stub rate',
    updatedAt: '2026-03-28T12:00:00+00:00',
    availableMethods: ['cash'],
  };
}

describe('exchange store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('keeps the newest quote when older request resolves later', async () => {
    const store = useExchangeStore();
    const first = createDeferred<MiniappQuoteResponse>();
    const second = createDeferred<MiniappQuoteResponse>();

    vi.mocked(fetchQuote)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const firstRequest = store.refreshQuote({
      currencySell: 'RUB',
      currencyBuy: 'THB',
      amountSell: 5000,
    });
    const secondRequest = store.refreshQuote({
      currencySell: 'RUB',
      currencyBuy: 'THB',
      amountSell: 6000,
    });

    second.resolve(makeQuote({
      currencySell: 'RUB',
      currencyBuy: 'THB',
      amountSell: 6000,
      amountBuy: 18000,
    }));
    await secondRequest;

    expect(store.quote?.amountSell).toBe(6000);
    expect(store.quoteLoading).toBe(false);

    first.resolve(makeQuote({
      currencySell: 'RUB',
      currencyBuy: 'THB',
      amountSell: 5000,
      amountBuy: 15000,
    }));
    await firstRequest;

    expect(store.quote?.amountSell).toBe(6000);
    expect(store.quote?.amountBuy).toBe(18000);
  });
});
