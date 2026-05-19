import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const exchangePagePath = resolve(process.cwd(), 'src/pages/ExchangePage.vue');

describe('ExchangePage rate formatting', () => {
  it('uses direct submit flow without modal trigger or swap CTA', () => {
    const source = readFileSync(exchangePagePath, 'utf8');

    expect(source).toContain('selectedMethod');
    expect(source).toContain('selectedCountry');
    expect(source).toContain('submitOrder');
    expect(source).not.toContain('swapCurrencies');
    expect(source).not.toContain('openOrderSheet');
    expect(source).not.toContain('fetchQuote');
  });
});
