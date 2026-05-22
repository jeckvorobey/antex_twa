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
    { id: 'rub-thb', fromCurrency: 'RUB', toCurrency: 'THB' },
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
      fromCurrency: 'RUB',
      toCurrency: 'THB',
      rate: 2.51,
      calculationRate: 0.4,
      rateDisplay: '2.51',
      rateText: '1 THB = 2.51 RUB',
      updatedAt: '2026-03-28T12:00:00+00:00',
      availableMethods: ['qrcode', 'cash'],
    },
    {
      id: 'rub-gel',
      fromCurrency: 'RUB',
      toCurrency: 'GEL',
      rate: 34.36,
      calculationRate: 0.03,
      rateDisplay: '34.36',
      rateText: '1 GEL = 34.36 RUB',
      updatedAt: '2026-03-28T12:00:00+00:00',
      availableMethods: ['qrcode', 'cash'],
    },
  ];

  it('calculates preliminary receive amount from selected sell amount', () => {
    expect(calculateLocalQuote({
      pairs,
      currencySell: 'RUB',
      currencyBuy: 'THB',
      amountSell: 6000,
    })).toMatchObject({
      currencySell: 'RUB',
      currencyBuy: 'THB',
      amountSell: 6000,
      amountBuy: 2400,
      rate: 0.4,
      rateDisplay: '0.40',
      rateText: '1 RUB = 0.40 THB',
      availableMethods: ['qrcode', 'cash'],
    });
  });

  it('returns null when the current pair is missing', () => {
    expect(calculateLocalQuote({
      pairs,
      currencySell: 'USDT',
      currencyBuy: 'THB',
      amountSell: 100,
    })).toBeNull();
  });
});

describe('country and city helpers', () => {
  const pairs = [
    { id: 'rub-thb', country: 'thailand', fromCurrency: 'RUB', toCurrency: 'THB' },
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
