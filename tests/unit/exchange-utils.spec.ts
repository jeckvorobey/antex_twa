import { describe, expect, it } from 'vitest';

import {
  buildBuyCurrencyOptions,
  buildReceiveLocationLabel,
  calculateLocalQuote,
  getCountryByCurrency,
  getDefaultReceiveMethod,
  getReceiveLocationTitleKey,
  resetCityForMethod,
} from '@utils/exchange';

describe('buildBuyCurrencyOptions', () => {
  const pairs = [
    { id: 'rub-thb', fromCurrency: 'THB', toCurrency: 'RUB' },
    { id: 'rub-gel', fromCurrency: 'RUB', toCurrency: 'GEL' },
    { id: 'rub-vnd', fromCurrency: 'RUB', toCurrency: 'VND' },
    { id: 'usdt-vnd', fromCurrency: 'USDT', toCurrency: 'VND' },
  ];

  it('builds options from canonical pair ids without exposing reverse sell directions', () => {
    expect(buildBuyCurrencyOptions(pairs, 'RUB')).toEqual([
      { label: 'THB', value: 'THB' },
      { label: 'GEL', value: 'GEL' },
      { label: 'VND', value: 'VND' },
    ]);
  });

  it('returns only allowed buy currencies for selected sell side', () => {
    expect(buildBuyCurrencyOptions(pairs, 'USDT')).toEqual([{ label: 'VND', value: 'VND' }]);
  });
});

describe('calculateLocalQuote', () => {
  const pairs = [
    {
      id: 'rub-thb',
      fromCurrency: 'THB',
      toCurrency: 'RUB',
      rate: 2.51,
      availableMethods: ['qrcode', 'cash'],
    },
    {
      id: 'rub-gel',
      fromCurrency: 'RUB',
      toCurrency: 'GEL',
      rate: 0.03,
      availableMethods: ['qrcode', 'cash'],
    },
  ];

  it('uses the last edited sell amount as the leading input', () => {
    expect(calculateLocalQuote({
      pairs,
      referenceQuote: {
        currencySell: 'RUB',
        currencyBuy: 'THB',
        amountSell: 5000,
        amountBuy: 2000,
        rate: 0.4,
        rateDisplay: '0.40',
        rateText: '1 RUB = 0.40 THB',
        updatedAt: '2026-03-28T12:00:00+00:00',
        availableMethods: ['qrcode', 'cash'],
      },
      currencySell: 'RUB',
      currencyBuy: 'THB',
      amountSell: 6000,
      amountBuy: null,
      lastEdited: 'sell',
    })?.amountBuy).toBe(2400);
  });

  it('uses the last edited receive amount as the leading input', () => {
    expect(calculateLocalQuote({
      pairs,
      referenceQuote: {
        currencySell: 'RUB',
        currencyBuy: 'THB',
        amountSell: 5000,
        amountBuy: 2000,
        rate: 0.4,
        rateDisplay: '0.40',
        rateText: '1 RUB = 0.40 THB',
        updatedAt: '2026-03-28T12:00:00+00:00',
        availableMethods: ['qrcode', 'cash'],
      },
      currencySell: 'RUB',
      currencyBuy: 'THB',
      amountSell: 6000,
      amountBuy: 1200,
      lastEdited: 'buy',
    })?.amountSell).toBe(3000);
  });
});

describe('country and city helpers', () => {
  const pairs = [
    { id: 'rub-thb', country: 'thailand', fromCurrency: 'THB', toCurrency: 'RUB' },
    { id: 'rub-gel', country: 'georgia', fromCurrency: 'RUB', toCurrency: 'GEL' },
  ];

  it('resolves country from selected buy currency', () => {
    expect(getCountryByCurrency(pairs, 'THB')).toBe('thailand');
    expect(getCountryByCurrency(pairs, 'GEL')).toBe('georgia');
  });

  it('resets city when qrcode is selected', () => {
    expect(resetCityForMethod('qrcode', 10)).toBeNull();
    expect(resetCityForMethod('cash', 10)).toBe(10);
  });
});

describe('receive method helper', () => {
  it('prefers qrcode when available', () => {
    expect(getDefaultReceiveMethod('THB', ['cash', 'qrcode'])).toBe('qrcode');
  });

  it('falls back to cash when qrcode is not available', () => {
    expect(getDefaultReceiveMethod('THB', ['cash'])).toBe('cash');
  });

  it('defaults to qrcode when no methods are available', () => {
    expect(getDefaultReceiveMethod('THB', null)).toBe('qrcode');
  });
});

describe('receive location presentation', () => {
  it('switches the title to cash mode and appends city to the country label', () => {
    expect(getReceiveLocationTitleKey('qrcode')).toBe('exchange.qrcodeCountries');
    expect(getReceiveLocationTitleKey('cash')).toBe('exchange.cash');

    expect(buildReceiveLocationLabel({
      method: 'qrcode',
      countryLabel: 'Таиланд',
      cityLabel: 'Паттайя',
    })).toBe('Таиланд');

    expect(buildReceiveLocationLabel({
      method: 'cash',
      countryLabel: 'Таиланд',
      cityLabel: 'Паттайя',
    })).toBe('Таиланд, Паттайя');
  });
});
