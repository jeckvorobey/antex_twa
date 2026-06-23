import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const homePageSource = readFileSync(resolve(process.cwd(), 'src/pages/HomePage.vue'), 'utf8');
const exchangePageSource = readFileSync(
  resolve(process.cwd(), 'src/pages/ExchangePage.vue'),
  'utf8',
);
const historyPageSource = readFileSync(resolve(process.cwd(), 'src/pages/HistoryPage.vue'), 'utf8');
const profilePageSource = readFileSync(resolve(process.cwd(), 'src/pages/ProfilePage.vue'), 'utf8');

describe('miniapp background refresh on route revisit', () => {
  it('keeps initial blocking load only for the first home visit', () => {
    expect(homePageSource).toContain('if (!homeStore.loaded || !homeStore.data) {');
    expect(homePageSource).toContain('await homeStore.load();');
    expect(homePageSource).toContain('void homeStore.refresh();');
  });

  it('keeps initial blocking load only for the first exchange visit', () => {
    expect(exchangePageSource).toContain(
      'if (!exchangeStore.loaded || !exchangeStore.screen || !exchangeStore.cities.length) {',
    );
    expect(exchangePageSource).toContain('await exchangeStore.load();');
    expect(exchangePageSource).toContain('void exchangeStore.refresh();');
  });

  it('refreshes only the first history page in background on revisit', () => {
    expect(historyPageSource).toContain('if (!ordersStore.loaded || !ordersStore.items.length) {');
    expect(historyPageSource).toContain('await ordersStore.loadFirstPage();');
    expect(historyPageSource).toContain('void ordersStore.refresh();');
  });

  it('keeps initial blocking load only for the first profile visit', () => {
    expect(profilePageSource).toContain('if (!profileStore.loaded || !profileStore.data) {');
    expect(profilePageSource).toContain('await profileStore.load();');
    expect(profilePageSource).toContain('void profileStore.refresh();');
  });
});
