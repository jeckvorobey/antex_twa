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
    expect(source).toContain('shouldConfirmOfflineSubmit');
    expect(source).toContain('await exchangeStore.refresh()');
    expect(source).toContain("managerAvailability.status === 'offline'");
    expect(source).toContain("t('order.successOffline')");
    expect(source).toContain('if (submitFlowPending.value)');
    expect(source).toContain(':disable="!canSubmit || submitFlowPending"');
  });
});
