import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const formSources = [
  resolve(process.cwd(), 'src/pages/ExchangePage.vue'),
  resolve(process.cwd(), 'src/components/orders/OrderFormSheet.vue'),
].map((path) => readFileSync(path, 'utf8'));

describe('cash delivery form contract', () => {
  it('requests a backend cash quote only from the existing receive-method flow', () => {
    for (const source of formSources) {
      expect(source).toContain("selectedMethod.value === 'cash'");
      expect(source).toContain('exchangeStore.refreshCashDeliveryQuote');
      expect(source).toContain('canRequestCashDeliveryQuote');
      expect(source).toContain('getMiniappErrorCode');
      expect(source).toContain('getMiniappErrorMessageKey');
    }
  });

  it('does not add UI copy or fields describing the internal calculation', () => {
    for (const source of formSources) {
      expect(source).not.toContain('cashDeliveryFee');
      expect(source).not.toContain('deliveryRate');
      expect(source).not.toContain('10 USDT');
    }
  });
});
