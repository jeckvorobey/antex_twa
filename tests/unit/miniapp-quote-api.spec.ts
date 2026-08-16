import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@boot/axios', () => ({
  api: {
    get: vi.fn(),
  },
}));

import { api } from '@boot/axios';
import { fetchQuote } from '@services/api/miniapp.service';

const publicQuote = {
  currencySell: 'RUB',
  currencyBuy: 'THB',
  amountSell: 5000,
  amountBuy: 1975,
  rate: 0.395,
  rateDisplay: '2.53',
  rateText: '1 THB = 2.53 RUB',
  updatedAt: '2026-08-15T12:00:00+00:00',
  availableMethods: ['qrcode', 'cash'],
};

describe('miniapp quote API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.get).mockResolvedValue({ data: publicQuote });
  });

  it('passes optional receive method and cancellation signal as transport config', async () => {
    const controller = new AbortController();

    await expect(
      fetchQuote(
        {
          currencySell: 'RUB',
          currencyBuy: 'THB',
          amountSell: 5000,
          methodGet: 'cash',
        },
        { signal: controller.signal },
      ),
    ).resolves.toEqual(publicQuote);

    expect(api.get).toHaveBeenCalledWith('/api/miniapp/exchange/quote', {
      params: {
        currencySell: 'RUB',
        currencyBuy: 'THB',
        amountSell: 5000,
        methodGet: 'cash',
      },
      signal: controller.signal,
    });
  });

  it('keeps the public quote shape free from internal calculation fields', async () => {
    const quote = await fetchQuote({
      currencySell: 'RUB',
      currencyBuy: 'THB',
      amountSell: 5000,
    });

    expect(quote).toEqual(publicQuote);
    expect(quote).not.toHaveProperty('cashDeliveryFee');
    expect(quote).not.toHaveProperty('deliveryRate');
  });
});
