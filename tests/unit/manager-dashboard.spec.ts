import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import type { ManagerOrderSummary } from '@types/manager-chat';
import {
  countTodayOrders,
  formatActiveOrderTotals,
  formatManagerDashboardDate,
  millisecondsUntilNextLocalDay,
} from '@utils/manager-dashboard';

const helperPath = resolve(process.cwd(), 'src/utils/manager-dashboard.ts');
const dashboardPath = resolve(process.cwd(), 'src/pages/manager/ManagerDashboardPage.vue');
const kpiPath = resolve(process.cwd(), 'src/components/manager/ManagerDashboardKpi.vue');
const queuePath = resolve(process.cwd(), 'src/components/manager/ManagerActiveOrderQueue.vue');
const queueItemPath = resolve(
  process.cwd(),
  'src/components/manager/ManagerActiveOrderQueueItem.vue',
);
const headerPath = resolve(process.cwd(), 'src/components/ui/AppHeaderBar.vue');
const managerStylesPath = resolve(process.cwd(), 'src/css/manager.scss');
const appStylesPath = resolve(process.cwd(), 'src/css/app.scss');

function makeOrder(
  id: number,
  currencySell: string,
  amountSell: number,
  createdAt: string,
): ManagerOrderSummary {
  return {
    id,
    publicNumber: `202608${String(id).padStart(4, '0')}`,
    currencySell,
    amountSell,
    currencyBuy: 'THB',
    amountBuy: amountSell * 0.33,
    rate: 0.33,
    rateDisplay: '0,33',
    rateText: '1 RUB = 0,33 THB',
    country: 'thailand',
    city: null,
    status: 1,
    methodGet: 'cash',
    createdAt,
    user: null,
  };
}

describe('manager dashboard contract', () => {
  it('provides a dedicated typed data helper', () => {
    expect(existsSync(helperPath)).toBe(true);
    expect(readFileSync(helperPath, 'utf8')).toContain('formatManagerDashboardDate');
  });

  it('formats the current date like the Penpot heading', () => {
    expect(formatManagerDashboardDate(new Date(2026, 7, 21, 12), 'ru', 'Сегодня')).toBe(
      'Сегодня. 21 августа 2026',
    );
  });

  it('counts only orders created on the current local day', () => {
    const orders = [
      makeOrder(1, 'RUB', 25_000, '2026-08-21T08:00:00+03:00'),
      makeOrder(2, 'RUB', 12_500, '2026-08-20T23:59:00+03:00'),
      makeOrder(3, 'USDT', 900, '2026-08-21T10:00:00+03:00'),
    ];

    expect(countTodayOrders(orders, new Date('2026-08-21T12:00:00+03:00'))).toBe(2);
  });

  it('schedules the next refresh at the following local midnight', () => {
    const now = new Date(2026, 7, 21, 23, 59, 30, 0);

    expect(millisecondsUntilNextLocalDay(now)).toBe(30_000);
  });

  it('groups active sell amounts by currency without mixing units', () => {
    const orders = [
      makeOrder(1, 'RUB', 25_000, '2026-08-21T08:00:00+03:00'),
      makeOrder(2, 'RUB', 12_500, '2026-08-21T09:00:00+03:00'),
      makeOrder(3, 'USDT', 900, '2026-08-21T10:00:00+03:00'),
    ];

    expect(formatActiveOrderTotals(orders, 'ru')).toBe('37 500 RUB · 900 USDT');
    expect(formatActiveOrderTotals([], 'ru')).toBe('');
  });

  it('composes the page from dedicated Penpot-aligned manager components', () => {
    expect(existsSync(kpiPath)).toBe(true);
    expect(existsSync(queuePath)).toBe(true);
    expect(existsSync(queueItemPath)).toBe(true);

    const source = readFileSync(dashboardPath, 'utf8');
    expect(source).toContain('ManagerDashboardKpi');
    expect(source).toContain('ManagerActiveOrderQueue');
    expect(source).not.toContain("import OrderCard from '@components/orders/OrderCard.vue'");
  });

  it('limits the compact queue to four items and delegates each row', () => {
    expect(existsSync(queuePath)).toBe(true);
    const source = readFileSync(queuePath, 'utf8');
    expect(source).toContain('orders.slice(0, 4)');
    expect(source).toContain('<ManagerActiveOrderQueueItem');
    expect(source).toContain("emit('select', order.id)");
    expect(source).toContain("emit('viewAll')");
  });

  it('keeps queue rows keyboard-accessible', () => {
    expect(existsSync(queueItemPath)).toBe(true);
    const source = readFileSync(queueItemPath, 'utf8');
    expect(source).toContain('tabindex="0"');
    expect(source).toContain("event.key !== 'Enter' && event.key !== ' '");
    expect(source).toContain("emit('select')");
  });

  it('uses the shared header with manager role and manager profile target', () => {
    const pageSource = readFileSync(dashboardPath, 'utf8');
    const headerSource = readFileSync(headerPath, 'utf8');
    expect(pageSource).toContain('<AppHeaderBar');
    expect(pageSource).toContain(':eyebrow="t(\'manager.role\')"');
    expect(pageSource).toContain('profile-route-name="managerProfile"');
    expect(headerSource).toContain('eyebrow?: string | null');
    expect(headerSource).toContain('profileRouteName?: string');
    expect(headerSource).toContain('app-header-bar__eyebrow');
  });

  it('derives the date, KPI trends and totals from real store data', () => {
    const source = readFileSync(dashboardPath, 'utf8');
    expect(source).toContain('formatManagerDashboardDate');
    expect(source).toContain('countTodayOrders');
    expect(source).toContain('formatActiveOrderTotals');
    expect(source).toContain('chatStore.dashboardChatTotal');
    expect(source).toContain('chatStore.unreadTotal');
    expect(source).toContain('chatStore.loadDashboardChatTotal()');
    expect(source).toContain('millisecondsUntilNextLocalDay');
    expect(source).toContain('clearTimeout(dayRefreshTimer)');
  });

  it('uses the flat Penpot layout surface and canonical font roles', () => {
    const source = readFileSync(managerStylesPath, 'utf8');
    const appSource = readFileSync(appStylesPath, 'utf8');
    const layoutBlock = source.match(/\.manager-layout\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
    expect(layoutBlock).toContain('background: var(--antex-bg-primary);');
    expect(layoutBlock).not.toContain('gradient');
    expect(source).toContain("font-family: 'Montserrat Alternates', 'Inter Tight', sans-serif;");
    expect(source).toContain("font-family: 'Inter Tight', sans-serif;");
    expect(appSource).toContain("font-family: 'Montserrat', 'Montserrat Alternates', sans-serif;");
  });

  it('scopes the exact Penpot palette to the dashboard route shell', () => {
    const stylesSource = readFileSync(managerStylesPath, 'utf8');
    const layoutSource = readFileSync(
      resolve(process.cwd(), 'src/layouts/ManagerLayout.vue'),
      'utf8',
    );
    expect(layoutSource).toContain("'manager-layout--dashboard': route.name === 'managerDashboard'");
    expect(stylesSource).toContain('.manager-layout--dashboard {');
    expect(stylesSource).toContain('--antex-gold-base: #ffb300;');
    expect(stylesSource).toContain('--antex-gold-light: #f1c769;');
    expect(stylesSource).toContain('--antex-text-muted: #aab7b4;');
  });
});
