import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const orderFormSheetPath = resolve(process.cwd(), 'src/components/orders/OrderFormSheet.vue');

describe('OrderFormSheet amount formatting', () => {
  it('uses the shared readable number helper for grouped amount input', () => {
    const source = readFileSync(orderFormSheetPath, 'utf8');

    expect(source).toContain(':model-value="formattedAmountSell"');
    expect(source).toContain('inputmode="decimal"');
    expect(source).toContain('parseReadableNumber(value)');
    expect(source).not.toContain('v-model.number="amountSell"');
    expect(source).not.toContain('type="number"');
  });
});
