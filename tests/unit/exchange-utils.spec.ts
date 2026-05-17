import { describe, expect, it } from 'vitest';

import {
  buildBuyCurrencyOptions,
  getDefaultReceiveMethod,
  swapExchangeDirection,
} from '@utils/exchange';

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

describe('buildBuyCurrencyOptions', () => {
  const pairs = [
    { fromCurrency: 'RUB', toCurrency: 'THB' },
    { fromCurrency: 'RUB', toCurrency: 'GEL' },
    { fromCurrency: 'RUB', toCurrency: 'VND' },
    { fromCurrency: 'USDT', toCurrency: 'VND' },
  ];

  it('builds options from backend-driven pairs without currency hardcode', () => {
    expect(buildBuyCurrencyOptions(pairs, 'RUB')).toEqual([
      { label: 'THB', value: 'THB' },
      { label: 'GEL', value: 'GEL' },
      { label: 'VND', value: 'VND' },
    ]);
  });

  it('includes reverse pair options', () => {
    expect(buildBuyCurrencyOptions(pairs, 'GEL')).toEqual([
      { label: 'RUB', value: 'RUB' },
    ]);
  });
});

describe('getDefaultReceiveMethod', () => {
  it('uses quote methods first', () => {
    expect(getDefaultReceiveMethod('VND', ['bank'])).toBe('bank');
  });

  it('uses currency defaults for supported receive currencies', () => {
    expect(getDefaultReceiveMethod('THB')).toBe('cash');
    expect(getDefaultReceiveMethod('GEL')).toBe('cash');
    expect(getDefaultReceiveMethod('VND')).toBe('cash');
    expect(getDefaultReceiveMethod('USDT')).toBe('wallet');
    expect(getDefaultReceiveMethod('RUB')).toBe('card');
  });
});
