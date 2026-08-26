import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const historyPagePath = resolve(process.cwd(), 'src/pages/HistoryPage.vue');
const historySource = readFileSync(historyPagePath, 'utf8');

describe('HistoryPage pagination and repeat contract', () => {
  it('uses Quasar infinite scroll with card skeletons and manual refresh button', () => {
    expect(historySource).toContain('<q-infinite-scroll');
    expect(historySource).toContain('<AntexSkeleton preset="order-card"');
    expect(historySource).toContain('icon="refresh"');
    expect(historySource).toContain(':aria-label="t(\'history.refresh\')"');
    expect(historySource).toContain(':scroll-target="historyScrollRef"');
    expect(historySource).toContain('ref="historyScrollRef"');
    expect(historySource).toContain('app-page--history');
    expect(historySource).toContain(':aria-busy="ordersStore.loading || ordersStore.refreshing"');
    expect(historySource).toContain('ordersStore.loading && !ordersStore.items.length');
  });

  it('keeps cancelled filter and delegates repeat action to shared OrderCard', () => {
    expect(historySource).toContain("value: 'cancelled'");
    expect(historySource).toContain("t('history.cancelled')");
    expect(historySource).toContain('<OrderCard');
    expect(historySource).toContain('mode="user"');
    expect(historySource).toContain('@repeat="repeatOrder(item)"');
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

  it('renders every history order through the shared card instead of inline markup', () => {
    expect(historySource).toContain('class="app-history-card app-card-shadow"');
    expect(historySource).toContain(':order="item"');
    expect(historySource).not.toContain('class="app-history-card__number"');
    expect(historySource).not.toContain('<AntexCard class="app-history-list">');
  });
});
