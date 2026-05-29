import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const historyPagePath = resolve(process.cwd(), 'src/pages/HistoryPage.vue');
const historySource = readFileSync(historyPagePath, 'utf8');

describe('HistoryPage pagination and repeat contract', () => {
  it('uses Quasar infinite scroll with dots loader and manual refresh button', () => {
    expect(historySource).toContain('<q-infinite-scroll');
    expect(historySource).toContain('<q-spinner-dots');
    expect(historySource).toContain("icon=\"refresh\"");
    expect(historySource).toContain(":aria-label=\"t('history.refresh')\"");
    expect(historySource).toContain(':scroll-target="historyScrollRef"');
    expect(historySource).toContain('ref="historyScrollRef"');
    expect(historySource).toContain('app-page--history');
  });

  it('keeps cancelled filter and repeat action in the page source', () => {
    expect(historySource).toContain("value: 'cancelled'");
    expect(historySource).toContain("t('history.cancelled')");
    expect(historySource).toContain("icon=\"autorenew\"");
    expect(historySource).toContain(":label=\"t('history.repeat')\"");
    expect(historySource).not.toContain(":aria-label=\"t('history.repeat')\"");
    expect(historySource).not.toContain("{{ item.currencySell }} → {{ item.currencyBuy }}");
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

  it('keeps history card amount, status, and time split across Quasar rows', () => {
    expect(historySource).toContain('class="row justify-center no-wrap"');
    expect(historySource).toContain('class="col-12 app-history-item__amount text-center ellipsis"');
    expect(historySource).toContain('class="row items-center no-wrap q-mt-xs"');
    expect(historySource).toContain('class="col-4 row justify-start"');
    expect(historySource).toContain('class="col-4 row justify-center"');
    expect(historySource).toContain('class="col-4 app-history-item__time text-right"');
  });
});
