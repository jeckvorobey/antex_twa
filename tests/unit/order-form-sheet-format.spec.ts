import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const orderFormSheetPath = resolve(process.cwd(), 'src/components/orders/OrderFormSheet.vue');
const detailsComponentPath = resolve(
  process.cwd(),
  'src/components/orders/ExchangeOrderDetails.vue',
);
const localePath = resolve(process.cwd(), 'src/i18n/ru/index.ts');
const warningNoticePath = resolve(process.cwd(), 'src/components/ui/AppWarningNotice.vue');
const offlineNoticePath = resolve(process.cwd(), 'src/components/ui/AppOfflineNotice.vue');
const antexNoticePath = resolve(process.cwd(), 'src/components/ui/AntexNotice.vue');
const appStylesPath = resolve(process.cwd(), 'src/css/app.scss');

describe('OrderFormSheet amount formatting', () => {
  it('does not keep duplicated amount, currency, and contact fields after replacing them with the shared component', () => {
    const source = readFileSync(orderFormSheetPath, 'utf8');

    expect(source).not.toContain("{{ t('order.amount') }}");
    expect(source).not.toContain("{{ t('order.currency') }}");
    expect(source).not.toContain("{{ t('order.contact') }}");
    expect(source).not.toContain('v-model:contact-telegram="contactTelegram"');
  });

  it('reuses the shared exchange order details component instead of duplicating location fields', () => {
    const source = readFileSync(orderFormSheetPath, 'utf8');

    expect(source).toContain(
      "import ExchangeOrderDetails from '@components/orders/ExchangeOrderDetails.vue'",
    );
    expect(source).toContain('<ExchangeOrderDetails');
    expect(source).toContain('v-model:selected-sell-currency="selectedSellCurrency"');
    expect(source).toContain('v-model:selected-buy-currency="currencyBuy"');
    expect(source).toContain('v-model:amount-sell="amountSell"');
    expect(source).toContain(':amount-buy="amountBuy"');
    expect(source).toContain('v-model:selected-country="selectedCountry"');
    expect(source).toContain('v-model:selected-method="selectedMethod"');
    expect(source).toContain('v-model:selected-city-id="selectedCityId"');
    expect(source).not.toContain('show-contact');
  });

  it('runs shared preliminary validation before submit and warns via Antex notify', () => {
    const source = readFileSync(orderFormSheetPath, 'utf8');

    expect(source).toContain('validatePreliminaryOrderDraft');
    expect(source).toContain("notify('negative', t(validation.messageKey, validation.params))");
  });

  it('shows the rate warning through a reusable warning notice component', () => {
    const source = readFileSync(orderFormSheetPath, 'utf8');
    const localeSource = readFileSync(localePath, 'utf8');
    const warningNoticeSource = readFileSync(warningNoticePath, 'utf8');
    const antexNoticeSource = readFileSync(antexNoticePath, 'utf8');

    expect(source).toContain("import AppWarningNotice from '@components/ui/AppWarningNotice.vue'");
    expect(source).toContain('<AppWarningNotice>');
    expect(source).toContain("{{ t('order.rateNotice') }}");
    expect(source).not.toContain("t('order.description')");
    expect(localeSource).toContain('rateNotice:');
    expect(localeSource).not.toContain('description:');
    expect(source).toContain("{{ t('order.rateNoticeTitle') }}");
    expect(warningNoticeSource).toContain('<AntexNotice');
    expect(warningNoticeSource).toContain(":dismiss-label=\"t('common.close')\"");
    expect(antexNoticeSource).toContain(":role=\"tone === 'warning' ? 'alert' : 'status'\"");
    expect(antexNoticeSource).toContain('class="antex-notice__dismiss"');
    expect(warningNoticeSource).not.toContain('<q-banner');
  });

  it('keeps both notices compact and responsive on narrow mobile screens', () => {
    const warningNoticeSource = readFileSync(warningNoticePath, 'utf8');
    const offlineNoticeSource = readFileSync(offlineNoticePath, 'utf8');
    const antexNoticeSource = readFileSync(antexNoticePath, 'utf8');
    const appStylesSource = readFileSync(appStylesPath, 'utf8');

    expect(warningNoticeSource).toContain('dismissible');
    expect(antexNoticeSource).toContain('<q-banner');
    expect(appStylesSource).toContain('.antex-notice__dismiss {');
    expect(appStylesSource).toContain('min-width: 44px');
    expect(offlineNoticeSource).toContain("replace(/^Ежедневно\\s+/i, '')");
    expect(offlineNoticeSource).toContain('app-offline-notice__hours');
  });
});

describe('ExchangeOrderDetails shared component contract', () => {
  it('owns the full shared exchange form used by exchange and order sheet', () => {
    const source = readFileSync(detailsComponentPath, 'utf8');

    expect(source).toContain('defineProps<{');
    expect(source).toContain('selectedSellCurrency: string');
    expect(source).toContain('selectedBuyCurrency: string');
    expect(source).toContain('amountSell: number | null');
    expect(source).toContain('amountBuy: number | null');
    expect(source).toContain('readonly');
    expect(source).toContain('selectedMethod: MiniappReceiveMethod');
    expect(source).toContain('bank_account');
    expect(source).toContain('pay_services');
    expect(source).toContain('selectedCountry: string | null');
    expect(source).toContain('selectedCityId: number | null');
    expect(source).toContain("t('exchange.payAmount')");
    expect(source).toContain("t('exchange.receiveCurrency')");
    expect(source).toContain("t('exchange.receiveMethod')");
    expect(source).toContain("t('exchange.cashCities')");
    expect(source).not.toContain("t('order.contact')");
  });

  it('exposes focusAmountSell for repeat order flow', () => {
    const source = readFileSync(detailsComponentPath, 'utf8');

    expect(source).toContain('const amountSellInputRef = ref');
    expect(source).toContain('function focusAmountSell()');
    expect(source).toContain('defineExpose({ focusAmountSell });');
    expect(source).toContain('ref="amountSellInputRef"');
  });
});
