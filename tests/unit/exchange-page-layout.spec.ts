import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const exchangePagePath = resolve(process.cwd(), 'src/pages/ExchangePage.vue');
const appStylesPath = resolve(process.cwd(), 'src/css/app.scss');
const exchangeOrderDetailsPath = resolve(
  process.cwd(),
  'src/components/orders/ExchangeOrderDetails.vue',
);

describe('ExchangePage responsive layout contract', () => {
  it('keeps the exchange form inside the viewport with Quasar-first wrappers', () => {
    const pageSource = readFileSync(exchangePagePath, 'utf8');
    const stylesSource = readFileSync(appStylesPath, 'utf8');
    const detailsSource = readFileSync(exchangeOrderDetailsPath, 'utf8');

    expect(pageSource).toContain('class="app-screen app-screen--exchange fit column no-wrap"');
    expect(pageSource).toContain('class="col column no-wrap"');
    expect(pageSource).toContain(
      'class="app-exchange-content col column q-gutter-md no-wrap overflow-hidden"',
    );
    expect(pageSource).toContain('class="q-pt-md app-exchange-submit"');
    expect(detailsSource).toContain('class="app-order-sheet__methods q-mt-xs"');
    expect(detailsSource).toContain('class="app-chip-row app-chip-row--exchange"');
    expect(pageSource).not.toContain('inline');

    expect(stylesSource).toContain('width: min(100%, 390px);');
    expect(stylesSource).toContain('.app-exchange-submit {\n  flex: 0 0 auto;');
    expect(stylesSource).toContain('.app-exchange-content {\n  padding-top: 16px;');
    expect(stylesSource).toContain(
      '.app-exchange-calculator__control,\n.app-order-sheet__control {\n  width: 100%;\n  min-width: 0;',
    );
    expect(stylesSource).toContain(
      '.app-exchange-calculator__currency,\n.app-exchange-calculator__amount,\n.app-order-sheet__input,\n.app-order-sheet__select {\n  min-width: 0;',
    );
  });

  it('reuses the shared exchange order details component for location and method fields', () => {
    const pageSource = readFileSync(exchangePagePath, 'utf8');

    expect(pageSource).toContain(
      "import AppWarningNotice from '@components/ui/AppWarningNotice.vue'",
    );
    expect(pageSource).toContain('<AppWarningNotice>');
    expect(pageSource).toContain("{{ t('order.rateNotice') }}");
    expect(pageSource).toContain(
      "import ExchangeOrderDetails from '@components/orders/ExchangeOrderDetails.vue'",
    );
    expect(pageSource).toContain('<ExchangeOrderDetails');
    expect(pageSource).toContain('v-model:selected-sell-currency="selectedSellCurrency"');
    expect(pageSource).toContain('v-model:selected-buy-currency="selectedBuyCurrency"');
    expect(pageSource).toContain('v-model:amount-sell="amountSell"');
    expect(pageSource).toContain(':amount-buy="amountBuy"');
    expect(pageSource).toContain('v-model:selected-country="selectedCountry"');
    expect(pageSource).toContain('v-model:selected-method="selectedMethod"');
    expect(pageSource).toContain('v-model:selected-city-id="selectedCityId"');
    expect(pageSource).not.toContain("{{ t('exchange.payAmount') }}");
    expect(pageSource).not.toContain("{{ t('exchange.receiveCurrency') }}");
  });

  it('uses readable text inputs for grouped large amounts', () => {
    const pageSource = readFileSync(exchangePagePath, 'utf8');
    const detailsSource = readFileSync(exchangeOrderDetailsPath, 'utf8');

    expect(detailsSource).toContain(':model-value="formattedAmountSell"');
    expect(detailsSource).toContain(':model-value="formattedAmountBuy"');
    expect(detailsSource).toContain('readonly');
    expect(detailsSource).toContain('inputmode="decimal"');
    expect(detailsSource).toContain('parseReadableNumber(value)');
    expect(pageSource).not.toContain('v-model.number="amountSell"');
    expect(pageSource).not.toContain('v-model.number="amountBuy"');
    expect(detailsSource).not.toContain('type="number"');
  });
});
