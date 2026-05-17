import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const exchangePagePath = resolve(process.cwd(), 'src/pages/ExchangePage.vue');

describe('ExchangePage rate formatting', () => {
  it('uses backend-prepared rate display values', () => {
    const source = readFileSync(exchangePagePath, 'utf8');

    expect(source).toContain('pair.rateDisplay');
    expect(source).toContain('exchangeStore.quote.rateText');
    expect(source).not.toContain('formatPairRate');
    expect(source).not.toContain('toFixed(');
  });
});
