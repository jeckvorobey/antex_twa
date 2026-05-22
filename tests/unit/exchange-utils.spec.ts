import { describe, expect, it } from 'vitest';

import {
  buildBuyCurrencyOptions,
  buildReceiveLocationLabel,
  calculateLocalQuote,
  getCountryByCurrency,
  getDefaultReceiveMethod,
  getReceiveLocationTitleKey,
  resetCityForMethod,
  validatePreliminaryOrderDraft,
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

describe('validatePreliminaryOrderDraft', () => {
  const pairs = [
    {
      id: 'rub-thb',
      fromCurrency: 'RUB',
      toCurrency: 'THB',
      country: 'thailand',
      amountSellExample: 5000,
    },
    {
      id: 'usdt-gel',
      fromCurrency: 'USDT',
      toCurrency: 'GEL',
      country: 'georgia',
      amountSellExample: 100,
    },
  ];

  const cities = [
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
    {
      id: 2,
      name: 'Tbilisi',
      country: 'georgia',
      countryRuName: 'Грузия',
      countryCode: 'ge',
      countryFlag: '🇬🇪',
      createdAt: '2026-03-28T12:00:00+00:00',
      updatedAt: '2026-03-28T12:00:00+00:00',
    },
  ];

  it('returns warning key when sell amount is lower than pair default', () => {
    expect(validatePreliminaryOrderDraft({
      pairs,
      cities,
      currencySell: 'RUB',
      currencyBuy: 'THB',
      amountSell: 4999,
      selectedCountry: 'thailand',
      selectedMethod: 'qrcode',
      selectedCityId: null,
    })).toEqual({
      valid: false,
      messageKey: 'errors.exchange_min_amount',
      params: { amount: 5000, currency: 'RUB' },
    });
  });

  it('returns warning key when country is not selected', () => {
    expect(validatePreliminaryOrderDraft({
      pairs,
      cities,
      currencySell: 'RUB',
      currencyBuy: 'THB',
      amountSell: 5000,
      selectedCountry: null,
      selectedMethod: 'qrcode',
      selectedCityId: null,
    })).toEqual({
      valid: false,
      messageKey: 'errors.country_required',
    });
  });

  it('returns warning key when city is missing for cash', () => {
    expect(validatePreliminaryOrderDraft({
      pairs,
      cities,
      currencySell: 'RUB',
      currencyBuy: 'THB',
      amountSell: 5000,
      selectedCountry: 'thailand',
      selectedMethod: 'cash',
      selectedCityId: null,
    })).toEqual({
      valid: false,
      messageKey: 'errors.city_required',
    });
  });

  it('returns warning key when city country does not match selected country', () => {
    expect(validatePreliminaryOrderDraft({
      pairs,
      cities,
      currencySell: 'RUB',
      currencyBuy: 'THB',
      amountSell: 5000,
      selectedCountry: 'thailand',
      selectedMethod: 'cash',
      selectedCityId: 2,
    })).toEqual({
      valid: false,
      messageKey: 'errors.city_country_mismatch',
    });
  });

  it('accepts qrcode and cash drafts that satisfy all rules', () => {
    expect(validatePreliminaryOrderDraft({
      pairs,
      cities,
      currencySell: 'RUB',
      currencyBuy: 'THB',
      amountSell: 5000,
      selectedCountry: 'thailand',
      selectedMethod: 'qrcode',
      selectedCityId: null,
    })).toEqual({ valid: true });

    expect(validatePreliminaryOrderDraft({
      pairs,
      cities,
      currencySell: 'RUB',
      currencyBuy: 'THB',
      amountSell: 5000,
      selectedCountry: 'thailand',
      selectedMethod: 'cash',
      selectedCityId: 1,
    })).toEqual({ valid: true });
  });
});
