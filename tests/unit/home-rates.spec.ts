import { describe, expect, it } from 'vitest';

import {
  buildHomeRateFilterChips,
  buildHomeRateView,
  resetHomeRateExpansion,
  type HomeRateFilterChip,
} from '@utils/home-rates';
import type { MiniappRateCard } from '@types/miniapp';

const rates: MiniappRateCard[] = [
  {
    id: 'usdt-thb',
    label: 'USDT/THB',
    fromCurrency: 'USDT',
    toCurrency: 'THB',
    rate: 36.2,
    rateText: '1 USDT = 36.2 THB',
    amountSellExample: 100,
    amountBuyExample: 3620,
    updatedAt: '2026-05-12T10:00:00Z',
  },
  {
    id: 'usdt-vnd',
    label: 'USDT/VND',
    fromCurrency: 'USDT',
    toCurrency: 'VND',
    rate: 25500,
    rateText: '1 USDT = 25500 VND',
    amountSellExample: 100,
    amountBuyExample: 2550000,
    updatedAt: '2026-05-12T10:00:00Z',
  },
  {
    id: 'usdt-gel',
    label: 'USDT/GEL',
    fromCurrency: 'USDT',
    toCurrency: 'GEL',
    rate: 2.7,
    rateText: '1 USDT = 2.7 GEL',
    amountSellExample: 100,
    amountBuyExample: 270,
    updatedAt: '2026-05-12T10:00:00Z',
  },
  {
    id: 'rub-thb',
    label: 'RUB/THB',
    fromCurrency: 'RUB',
    toCurrency: 'THB',
    rate: 0.41,
    rateText: '1 RUB = 0.41 THB',
    amountSellExample: 5000,
    amountBuyExample: 2050,
    updatedAt: '2026-05-12T10:00:00Z',
  },
  {
    id: 'rub-vnd',
    label: 'RUB/VND',
    fromCurrency: 'RUB',
    toCurrency: 'VND',
    rate: 280,
    rateText: '1 RUB = 280 VND',
    amountSellExample: 5000,
    amountBuyExample: 1400000,
    updatedAt: '2026-05-12T10:00:00Z',
  },
];

describe('buildHomeRateFilterChips', () => {
  it('adds the all filter as the first chip', () => {
    expect(buildHomeRateFilterChips(['USDT', 'THB', 'RUB'], 'Все')).toEqual<HomeRateFilterChip[]>([
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
    });

    expect(view.visibleRates.map((rate) => rate.id)).toEqual([
      'usdt-thb',
      'usdt-vnd',
      'usdt-gel',
    ]);
    expect(view.canExpand).toBe(true);
  });

  it('filters THB pairs by currency participation on both sides', () => {
    const view = buildHomeRateView({
      rates,
      filterKey: 'THB',
      previewLimit: 3,
      expanded: false,
    });

    expect(view.filteredRates.map((rate) => rate.id)).toEqual([
      'usdt-thb',
      'rub-thb',
    ]);
  });

  it('does not show expand for USDT when there are only 3 pairs', () => {
    const view = buildHomeRateView({
      rates,
      filterKey: 'USDT',
      previewLimit: 3,
      expanded: false,
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
    });

    expect(view.canExpand).toBe(true);
  });

  it('shows all filtered pairs after expand', () => {
    const view = buildHomeRateView({
      rates,
      filterKey: 'ALL',
      previewLimit: 3,
      expanded: true,
    });

    expect(view.visibleRates.map((rate) => rate.id)).toEqual([
      'usdt-thb',
      'usdt-vnd',
      'usdt-gel',
      'rub-thb',
      'rub-vnd',
    ]);
  });
});

describe('resetHomeRateExpansion', () => {
  it('collapses the list on filter change or reload', () => {
    expect(resetHomeRateExpansion(true)).toBe(false);
    expect(resetHomeRateExpansion(false)).toBe(false);
  });
});
