import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const orderFormSheetPath = resolve(process.cwd(), 'src/components/orders/OrderFormSheet.vue');
const detailsComponentPath = resolve(process.cwd(), 'src/components/orders/ExchangeOrderDetails.vue');
const localePath = resolve(process.cwd(), 'src/i18n/ru/index.ts');
const warningNoticePath = resolve(process.cwd(), 'src/components/ui/AppWarningNotice.vue');

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

    expect(source).toContain("import ExchangeOrderDetails from '@components/orders/ExchangeOrderDetails.vue'");
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

  it('runs shared preliminary validation before submit and warns via Notify', () => {
    const source = readFileSync(orderFormSheetPath, 'utf8');

    expect(source).toContain('validatePreliminaryOrderDraft');
    expect(source).toContain("Notify.create({ type: 'negative', message: t(validation.messageKey");
  });

  it('shows the rate warning through a reusable warning notice component', () => {
    const source = readFileSync(orderFormSheetPath, 'utf8');
    const localeSource = readFileSync(localePath, 'utf8');
    const warningNoticeSource = readFileSync(warningNoticePath, 'utf8');

    expect(source).toContain("import AppWarningNotice from '@components/ui/AppWarningNotice.vue'");
    expect(source).toContain('<AppWarningNotice>');
    expect(source).toContain("{{ t('order.rateNotice') }}");
    expect(source).not.toContain("t('order.description')");
    expect(localeSource).toContain('rateNotice:');
    expect(localeSource).not.toContain('description:');
    expect(warningNoticeSource).toContain('<q-banner');
    expect(warningNoticeSource).toContain('<template #avatar>');
    expect(warningNoticeSource).toContain('text-body2 text-weight-medium');
    expect(warningNoticeSource).toContain('max-width: 100%;');
    expect(warningNoticeSource).not.toContain('app-warning-notice__body');
    expect(warningNoticeSource).not.toContain('overflow: hidden;');
  });
});

describe('ExchangeOrderDetails shared component contract', () => {
  it('owns the full shared exchange form used by exchange and order sheet', () => {
    const source = readFileSync(detailsComponentPath, 'utf8');

    expect(source).toContain("defineProps<{");
    expect(source).toContain("selectedSellCurrency: string");
    expect(source).toContain("selectedBuyCurrency: string");
    expect(source).toContain("amountSell: number | null");
    expect(source).toContain("amountBuy: number | null");
    expect(source).toContain('readonly');
    expect(source).toContain("selectedMethod: 'qrcode' | 'cash'");
    expect(source).toContain("selectedCountry: string | null");
    expect(source).toContain("selectedCityId: number | null");
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
