import { describe, expect, it } from 'vitest';

import { swapExchangeDirection } from '@utils/exchange';

describe('swapExchangeDirection', () => {
  it('swaps currencies and moves received amount into sell amount', () => {
    expect(swapExchangeDirection({
      currencySell: 'RUB',
      currencyBuy: 'THB',
      amountSell: 5000,
      amountBuy: 12881,
    })).toEqual({
      currencySell: 'THB',
      currencyBuy: 'RUB',
      amountSell: 12881,
    });
  });

  it('keeps current sell amount when receive amount is unavailable', () => {
    expect(swapExchangeDirection({
      currencySell: 'USDT',
      currencyBuy: 'THB',
      amountSell: 120,
    })).toEqual({
      currencySell: 'THB',
      currencyBuy: 'USDT',
      amountSell: 120,
    });
  });

  it('does not use stale amountBuy when quote is not current anymore', () => {
    expect(swapExchangeDirection({
      currencySell: 'RUB',
      currencyBuy: 'USDT',
      amountSell: 5000,
      amountBuy: 64,
      useQuotedAmountBuy: false,
    })).toEqual({
      currencySell: 'USDT',
      currencyBuy: 'RUB',
      amountSell: 5000,
    });
  });
});
