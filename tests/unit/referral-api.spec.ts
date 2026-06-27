import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const servicePath = resolve(process.cwd(), 'src/services/api/miniapp.service.ts');
const serviceSource = readFileSync(servicePath, 'utf8');

const typesPath = resolve(process.cwd(), 'src/types/miniapp.ts');
const typesSource = readFileSync(typesPath, 'utf8');

describe('AEX API service', () => {
  it('exports fetchAexReferralInfo function', () => {
    expect(serviceSource).toContain('export async function fetchAexReferralInfo');
    expect(serviceSource).toContain('/api/miniapp/aex/referral');
  });

  it('exports fetchAexTransactions with pagination params', () => {
    expect(serviceSource).toContain('export async function fetchAexTransactions');
    expect(serviceSource).toContain('/api/miniapp/aex/transactions');
    expect(serviceSource).toContain('limit');
    expect(serviceSource).toContain('offset');
  });

  it('exports applyReferralCode function', () => {
    expect(serviceSource).toContain('export async function applyReferralCode');
    expect(serviceSource).toContain('/api/miniapp/aex/referral/apply');
    expect(serviceSource).toContain('code');
  });
});

describe('AEX types', () => {
  it('defines AexBalance interface', () => {
    expect(typesSource).toContain('interface AexBalance');
    expect(typesSource).toContain('available: number');
    expect(typesSource).toContain('totalEarned: number');
    expect(typesSource).toContain('totalWithdrawn: number');
  });

  it('defines AexReferralInfo interface', () => {
    expect(typesSource).toContain('interface AexReferralInfo');
    expect(typesSource).toContain('referralCode: string');
    expect(typesSource).toContain('referralLink: string');
    expect(typesSource).toContain('totalReferrals: number');
    expect(typesSource).not.toContain('referrals: AexReferralItem[]');
  });

  it('defines AexTransactionItem with all operation types', () => {
    expect(typesSource).toContain('interface AexTransactionItem');
    expect(typesSource).toContain("'referral_reward'");
    expect(typesSource).toContain("'withdrawal'");
    expect(typesSource).toContain("'bonus'");
    expect(typesSource).toContain("'adjustment'");
    expect(typesSource).toContain('balanceAfter: number');
  });

  it('defines AexTransactionsResponse with pagination', () => {
    expect(typesSource).toContain('interface AexTransactionsResponse');
    expect(typesSource).toContain('items: AexTransactionItem[]');
    expect(typesSource).toContain('total: number');
    expect(typesSource).toContain('hasMore: boolean');
  });

  it('defines AexProfileSection for profile page', () => {
    expect(typesSource).toContain('interface AexProfileSection');
    expect(typesSource).toContain('balance: AexBalance');
    expect(typesSource).toContain('referralCode: string');
  });

  it('includes aex in MiniappProfileResponse', () => {
    expect(typesSource).toContain('aex?: AexProfileSection');
  });
});
