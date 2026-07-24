import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const routesSource = readFileSync(resolve(process.cwd(), 'src/router/routes.ts'), 'utf8');
const operationsPageSource = readFileSync(
  resolve(process.cwd(), 'src/pages/ReferralOperationsPage.vue'),
  'utf8',
);
const referralsPageSource = readFileSync(
  resolve(process.cwd(), 'src/pages/ReferralReferralsPage.vue'),
  'utf8',
);

describe('Referral detail pages', () => {
  it('registers routes for referrals and operations detail pages', () => {
    expect(routesSource).toContain("name: 'referralReferrals'");
    expect(routesSource).toContain("path: 'referral/referrals'");
    expect(routesSource).toContain("name: 'referralOperations'");
    expect(routesSource).toContain("path: 'referral/operations'");
  });

  it('renders operations page with lazy-load transaction list', () => {
    expect(operationsPageSource).toContain('<q-infinite-scroll');
    expect(operationsPageSource).toContain('loadNextPage');
    expect(operationsPageSource).toContain('txHasMore');
    expect(operationsPageSource).toContain('groupItemsByDate');
    expect(operationsPageSource).toContain('formatMiniappTime');
    expect(operationsPageSource).toContain('v-for="group in transactionGroups"');
    expect(operationsPageSource).not.toContain('formatMiniappDateTime');
  });

  it('renders referrals page with total accrued card and lazy-load list', () => {
    expect(referralsPageSource).toContain('<AexBalanceCard');
    expect(referralsPageSource).toContain("t('referral.totalAccrued')");
    expect(referralsPageSource).toContain('<q-infinite-scroll');
    expect(referralsPageSource).toContain('loadReferralsNextPage');
    expect(referralsPageSource).toContain('groupItemsByDate');
    expect(referralsPageSource).toContain('formatMiniappTime');
    expect(referralsPageSource).toContain('v-for="group in referralGroups"');
    expect(referralsPageSource).not.toContain('formatMiniappDateTime');
    expect(referralsPageSource).not.toContain('earnedAex');
  });
});
