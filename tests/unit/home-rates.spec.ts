import { describe, expect, it } from 'vitest';

import {
  buildHomeAvailableMethods,
  buildHomeRateCardPresentation,
  buildHomeRateFilterChips,
  buildHomeRateView,
  buildHomeVisibleLocations,
  resetHomeRateExpansion,
  resolveHomeCountryByCity,
  type HomeRateFilterChip,
} from '@utils/home-rates';
import type { MiniappLocationItem, MiniappRateCard } from '@types/miniapp';

const rates: MiniappRateCard[] = [
  {
    id: 'rub-thb',
    label: 'RUB/THB',
    country: 'thailand',
    countryLabel: 'Таиланд',
    fromCurrency: 'RUB',
    toCurrency: 'THB',
    rate: 2.44,
    calculationRate: 0.41,
    rateDisplay: '2.44',
    rateText: '1 THB = 2.44 RUB',
    amountSellExample: 5000,
    amountBuyExample: 2050,
    updatedAt: '2026-05-12T10:00:00Z',
    availableMethods: ['qrcode', 'cash'],
  },
  {
    fromCurrency: 'USDT',
    id: 'usdt-thb',
    label: 'USDT/THB',
    country: 'thailand',
    countryLabel: 'Таиланд',
    toCurrency: 'THB',
    rate: 36.2,
    calculationRate: 36.2,
    rateDisplay: '36.20',
    rateText: '1 USDT = 36.2 THB',
    amountSellExample: 100,
    amountBuyExample: 3620,
    updatedAt: '2026-05-12T10:00:00Z',
    availableMethods: ['qrcode', 'cash'],
  },
  {
    id: 'rub-vnd',
    label: 'RUB/VND',
    country: 'vietnam',
    countryLabel: 'Вьетнам',
    fromCurrency: 'RUB',
    toCurrency: 'VND',
    rate: 280,
    calculationRate: 280,
    rateDisplay: '280.00',
    rateText: '1 RUB = 280 VND',
    amountSellExample: 5000,
    amountBuyExample: 1400000,
    updatedAt: '2026-05-12T10:00:00Z',
    availableMethods: ['qrcode', 'cash'],
  },
  {
    id: 'usdt-vnd',
    label: 'USDT/VND',
    country: 'vietnam',
    countryLabel: 'Вьетнам',
    fromCurrency: 'USDT',
    toCurrency: 'VND',
    rate: 25500,
    calculationRate: 25500,
    rateDisplay: '25500.00',
    rateText: '1 USDT = 25500 VND',
    amountSellExample: 100,
    amountBuyExample: 2550000,
    updatedAt: '2026-05-12T10:00:00Z',
    availableMethods: ['qrcode', 'cash'],
  },
  {
    id: 'rub-gel',
    label: 'RUB/GEL',
    country: 'georgia',
    countryLabel: 'Грузия',
    fromCurrency: 'RUB',
    toCurrency: 'GEL',
    rate: 33.33,
    calculationRate: 0.03,
    rateDisplay: '33.33',
    rateText: '1 GEL = 33.33 RUB',
    amountSellExample: 5000,
    amountBuyExample: 150,
    updatedAt: '2026-05-12T10:00:00Z',
    availableMethods: ['qrcode', 'cash'],
  },
  {
    id: 'usdt-gel',
    label: 'USDT/GEL',
    country: 'georgia',
    countryLabel: 'Грузия',
    fromCurrency: 'USDT',
    toCurrency: 'GEL',
    rate: 2.7,
    calculationRate: 2.7,
    rateDisplay: '2.70',
    rateText: '1 USDT = 2.7 GEL',
    amountSellExample: 100,
    amountBuyExample: 270,
    updatedAt: '2026-05-12T10:00:00Z',
    availableMethods: ['qrcode', 'cash'],
  },
];

const locations: MiniappLocationItem[] = [
  {
    id: '1',
    city: 'Паттайя',
    country: 'thailand',
    countryLabel: 'Таиланд',
    hours: 'Ежедневно',
    accent: 'ocean',
  },
  {
    id: '2',
    city: 'Батуми',
    country: 'georgia',
    countryLabel: 'Грузия',
    hours: 'Ежедневно',
    accent: 'gold',
  },
];

describe('buildHomeRateFilterChips', () => {
  it('adds the all filter as the first chip', () => {
    expect(buildHomeRateFilterChips({
      backendChips: ['USDT', 'THB', 'RUB'],
      allLabel: 'Все',
      rates,
      selectedCountry: null,
    })).toEqual<HomeRateFilterChip[]>([
      { key: 'ALL', label: 'Все' },
      { key: 'USDT', label: 'USDT' },
      { key: 'THB', label: 'THB' },
      { key: 'RUB', label: 'RUB' },
    ]);
  });

  it('narrows chips to the selected country currencies', () => {
    expect(buildHomeRateFilterChips({
      backendChips: ['USDT', 'THB', 'RUB', 'GEL', 'VND'],
      allLabel: 'Все',
      rates,
      selectedCountry: 'thailand',
    })).toEqual<HomeRateFilterChip[]>([
      { key: 'ALL', label: 'Все' },
      { key: 'USDT', label: 'USDT' },
      { key: 'THB', label: 'THB' },
      { key: 'RUB', label: 'RUB' },
    ]);
  });
});

describe('buildHomeRateView', () => {
  it('shows 3 preview pairs for the default all filter', () => {
    const view = buildHomeRateView({
      rates,
      filterKey: 'ALL',
      previewLimit: 3,
      expanded: false,
      selectedCountry: null,
    });

    expect(view.visibleRates.map((rate) => rate.id)).toEqual([
      'rub-thb',
      'usdt-thb',
      'rub-vnd',
    ]);
    expect(view.canExpand).toBe(true);
  });

  it('keeps the backend priority order after THB filtering', () => {
    const view = buildHomeRateView({
      rates,
      filterKey: 'THB',
      previewLimit: 3,
      expanded: false,
      selectedCountry: null,
    });

    expect(view.filteredRates.map((rate) => rate.id)).toEqual([
      'rub-thb',
      'usdt-thb',
    ]);
  });

  it('does not show expand for USDT when there are only 3 pairs', () => {
    const view = buildHomeRateView({
      rates,
      filterKey: 'USDT',
      previewLimit: 3,
      expanded: false,
      selectedCountry: null,
    });

    expect(view.visibleRates.map((rate) => rate.id)).toEqual([
      'usdt-thb',
      'usdt-vnd',
      'usdt-gel',
    ]);
    expect(view.canExpand).toBe(false);
  });

  it('shows expand when the current filter has more than 3 pairs', () => {
    const view = buildHomeRateView({
      rates,
      filterKey: 'ALL',
      previewLimit: 3,
      expanded: false,
      selectedCountry: null,
    });

    expect(view.canExpand).toBe(true);
  });

  it('shows all filtered pairs after expand', () => {
    const view = buildHomeRateView({
      rates,
      filterKey: 'ALL',
      previewLimit: 3,
      expanded: true,
      selectedCountry: null,
    });

    expect(view.visibleRates.map((rate) => rate.id)).toEqual([
      'rub-thb',
      'usdt-thb',
      'rub-vnd',
      'usdt-vnd',
      'rub-gel',
      'usdt-gel',
    ]);
  });

  it('filters rates by selected country before currency chips', () => {
    const view = buildHomeRateView({
      rates,
      filterKey: 'ALL',
      previewLimit: 3,
      expanded: true,
      selectedCountry: 'thailand',
    });

    expect(view.filteredRates.map((rate) => rate.id)).toEqual([
      'rub-thb',
      'usdt-thb',
    ]);
  });
});

describe('home locations and methods', () => {
  it('shows all cities by default and only country cities after selection', () => {
    expect(buildHomeVisibleLocations(locations, null).map((item) => item.city)).toEqual([
      'Паттайя',
      'Батуми',
    ]);
    expect(buildHomeVisibleLocations(locations, 'thailand').map((item) => item.city)).toEqual([
      'Паттайя',
    ]);
  });

  it('resolves country by selected city', () => {
    expect(resolveHomeCountryByCity(locations, '2')).toBe('georgia');
  });

  it('enables cash only when a city is selected', () => {
    expect(buildHomeAvailableMethods(null)).toEqual(['qrcode']);
    expect(buildHomeAvailableMethods('1')).toEqual(['qrcode', 'cash']);
  });
});

describe('buildHomeRateCardPresentation', () => {
  it('keeps backend order for RUB to THB and adds display metadata', () => {
    expect(
      buildHomeRateCardPresentation({
        card: rates[0],
        selectedCityId: null,
      }),
    ).toEqual({
      left: {
        title: 'RUB',
        flag: '🇷🇺',
        meta: 'СБП, перевод',
      },
      right: {
        title: 'THB',
        flag: '🇹🇭',
        meta: 'по qrcode',
      },
      ratePrefix: 'от',
    });
  });

  it('swaps display order when RUB is on the right side', () => {
    expect(
      buildHomeRateCardPresentation({
        card: {
          ...rates[0],
          id: 'thb-rub',
          label: 'THB/RUB',
          fromCurrency: 'THB',
          toCurrency: 'RUB',
        },
        selectedCityId: null,
      }),
    ).toEqual({
      left: {
        title: 'RUB',
        flag: '🇷🇺',
        meta: 'СБП, перевод',
      },
      right: {
        title: 'THB',
        flag: '🇹🇭',
        meta: 'по qrcode',
      },
      ratePrefix: 'от',
    });
  });

  it('adds cash meta when a city is selected', () => {
    expect(
      buildHomeRateCardPresentation({
        card: rates[3],
        selectedCityId: '1',
      }),
    ).toEqual({
      left: {
        title: 'USDT',
        flag: 'USDT',
        meta: 'перевод',
      },
      right: {
        title: 'VND',
        flag: '🇻🇳',
        meta: 'по qrcode, наличными',
      },
      ratePrefix: 'от',
    });
  });
});

describe('resetHomeRateExpansion', () => {
  it('collapses the list on filter change or reload', () => {
    expect(resetHomeRateExpansion(true)).toBe(false);
    expect(resetHomeRateExpansion(false)).toBe(false);
  });
});
