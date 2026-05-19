import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const exchangePagePath = resolve(process.cwd(), 'src/pages/ExchangePage.vue');
const appStylesPath = resolve(process.cwd(), 'src/css/app.scss');

describe('ExchangePage responsive layout contract', () => {
  it('keeps the exchange form inside the viewport with Quasar-first wrappers', () => {
    const pageSource = readFileSync(exchangePagePath, 'utf8');
    const stylesSource = readFileSync(appStylesPath, 'utf8');

    expect(pageSource).toContain('class="app-screen app-screen--exchange fit column no-wrap"');
    expect(pageSource).toContain('class="col column no-wrap"');
    expect(pageSource).toContain('class="col column q-gutter-md no-wrap overflow-auto"');
    expect(pageSource).toContain('class="q-pt-md app-exchange-submit"');
    expect(pageSource).toContain('class="app-order-sheet__methods q-mt-xs"');
    expect(pageSource).not.toContain('inline');

    expect(stylesSource).toContain('width: min(100%, 390px);');
    expect(stylesSource).toContain('.app-exchange-submit {\n  flex: 0 0 auto;');
    expect(stylesSource).toContain('.app-exchange-calculator__control,\n.app-order-sheet__control {\n  width: 100%;\n  min-width: 0;');
    expect(stylesSource).toContain('.app-exchange-calculator__currency,\n.app-exchange-calculator__amount,\n.app-order-sheet__input,\n.app-order-sheet__select {\n  min-width: 0;');
  });

  it('uses readable text inputs for grouped large amounts', () => {
    const pageSource = readFileSync(exchangePagePath, 'utf8');

    expect(pageSource).toContain(':model-value="formattedAmountSell"');
    expect(pageSource).toContain(':model-value="formattedAmountBuy"');
    expect(pageSource).toContain('inputmode="decimal"');
    expect(pageSource).toContain("parseReadableNumber(value)");
    expect(pageSource).not.toContain('v-model.number="amountSell"');
    expect(pageSource).not.toContain('v-model.number="amountBuy"');
    expect(pageSource).not.toContain('type="number"');
  });
});
