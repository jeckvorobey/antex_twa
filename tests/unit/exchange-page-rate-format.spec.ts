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

  it('validates preliminary order and shows warning notification before submit', () => {
    const source = readFileSync(exchangePagePath, 'utf8');

    expect(source).toContain('validatePreliminaryOrderDraft');
    expect(source).toContain("Notify.create({ type: 'negative', message: t(validation.messageKey");
  });

  it('refreshes manager availability and confirms offline submit on the dedicated route', () => {
    const source = readFileSync(exchangePagePath, 'utf8');

    expect(source).toContain('offlineConfirmVisible');
    expect(source).toContain('<AppOfflineNotice');
    expect(source).toContain(':business-hours=');
    expect(source).toContain("{{ t('order.offlineInlineTitle') }}");
    expect(source).toContain("{{ t('order.offlineInlineNotice') }}");
    expect(source).toContain('persistent');
    expect(source).toContain('class="app-dialog--confirm"');
    expect(source).not.toContain('v-model="offlineConfirmVisible" position="bottom" persistent');
    expect(source).toContain('shouldConfirmOfflineSubmit');
    expect(source).toContain('await exchangeStore.refreshManagerAvailability()');
    expect(source).not.toContain(
      'await exchangeStore.refresh();\n    refreshQuoteForCurrentState();',
    );
    expect(source).toContain('const refreshedValidation = preliminaryValidation.value;');
    expect(source).toContain("managerAvailability.status === 'offline'");
    expect(source).toContain("t('order.success')");
    expect(source).not.toContain("t('order.successOffline')");
    expect(source).toContain('if (submitFlowPending.value)');
    expect(source).toContain(':disable="!canSubmit || submitFlowPending"');
    expect(source).toContain('@click="cancelOffline"');
    expect(source).toContain("{{ t('common.yes') }}");
    expect(source).toContain("{{ t('common.cancel') }}");
    expect(source).toContain(
      "catch {\n    return exchangeStore.screen?.managerAvailability.status === 'offline';",
    );
  });

  it('loads the first history page after a successful order without response availability', () => {
    const source = readFileSync(exchangePagePath, 'utf8');

    expect(source).toContain('await exchangeStore.submitOrder');
    expect(source).toContain('await ordersStore.loadFirstPage();');
    expect(source).not.toContain('ordersStore.prepend(order);');
    expect(source).not.toContain('order.managerAvailability?.status');
  });
});
