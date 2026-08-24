import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const historyPagePath = resolve(process.cwd(), 'src/pages/HistoryPage.vue');
const historySource = readFileSync(historyPagePath, 'utf8');

describe('HistoryPage pagination and repeat contract', () => {
  it('uses Quasar infinite scroll with dots loader and manual refresh button', () => {
    expect(historySource).toContain('<q-infinite-scroll');
    expect(historySource).toContain('<q-spinner-dots');
    expect(historySource).toContain('icon="refresh"');
    expect(historySource).toContain(':aria-label="t(\'history.refresh\')"');
    expect(historySource).toContain(':scroll-target="historyScrollRef"');
    expect(historySource).toContain('ref="historyScrollRef"');
    expect(historySource).toContain('app-page--history');
  });

  it('keeps cancelled filter and repeat action in the page source', () => {
    expect(historySource).toContain("value: 'cancelled'");
    expect(historySource).toContain("t('history.cancelled')");
    expect(historySource).toContain('icon="autorenew"');
    expect(historySource).not.toContain(':label="t(\'history.repeat\')"');
    expect(historySource).toContain(':aria-label="t(\'history.repeat\')"');
    expect(historySource).toContain('<q-tooltip>{{ t(\'history.repeat\') }}</q-tooltip>');
    expect(historySource).not.toContain('{{ item.currencySell }} → {{ item.currencyBuy }}');
  });

  it('opens order sheet with selected order draft without stale quote fields', () => {
    expect(historySource).toContain('uiStore.openOrderSheet({');
    expect(historySource).toContain('currencySell: item.currencySell');
    expect(historySource).toContain('currencyBuy: item.currencyBuy');
    expect(historySource).toContain('amountSell: item.amountSell');
    expect(historySource).toContain('country: item.country');
    expect(historySource).toContain('cityId: item.cityId');
    expect(historySource).not.toContain('amountBuy: item.amountBuy');
    expect(historySource).not.toContain('rate: item.rate');
  });

  it('renders every history order as its own gold bordered card with the saved rate', () => {
    expect(historySource).toContain(
      'class="app-history-card antex-border-gold app-card-shadow"',
    );
    expect(historySource).toContain('class="app-history-card__number"');
    expect(historySource).toContain('class="app-history-card__rate"');
    expect(historySource).toContain('{{ item.rateText }}');
    expect(historySource).not.toContain('<AppSurface class="app-history-list">');
  });
});
