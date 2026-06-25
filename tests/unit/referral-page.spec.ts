import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const referralPagePath = resolve(process.cwd(), 'src/pages/ReferralPage.vue');
const referralSource = readFileSync(referralPagePath, 'utf8');

describe('ReferralPage structure', () => {
  it('renders shared balance hero with AEX currency label', () => {
    expect(referralSource).toContain('<AexBalanceCard');
    expect(referralSource).toContain(':balance="availableBalance"');
    expect(referralSource).toContain(":label=\"t('referral.balanceLabel')\"");
  });

  it('does not render a standalone referral code field', () => {
    expect(referralSource).not.toContain("t('referral.yourCode')");
    expect(referralSource).not.toContain('app-referral-code-card__code-row');
    expect(referralSource).not.toContain('app-referral-code-card__code');
    expect(referralSource).not.toContain('copyCode');
  });

  it('keeps only referral link controls and the share button in the referral card', () => {
    expect(referralSource).toContain('referralLink');
    expect(referralSource).toContain('shareLink');
    expect(referralSource).toContain('copyLink');
    expect(referralSource).toContain("t('referral.referralLinkLabel')");
    expect(referralSource).toContain("t('referral.share')");
    expect(referralSource).toContain("t('referral.copyLink')");
  });

  it('builds correct Telegram deep-link URL', () => {
    expect(referralSource).toContain('startapp=ref_');
    expect(referralSource).toContain('VITE_TELEGRAM_BOT_USERNAME');
  });

  it('renders instruction section with 3 steps', () => {
    expect(referralSource).toContain("t('referral.howItWorks')");
    expect(referralSource).toContain("t('referral.instructionStep1')");
    expect(referralSource).toContain("t('referral.instructionStep2')");
    expect(referralSource).toContain("t('referral.instructionStep3')");
    expect(referralSource).toContain("t('referral.instructionReward')");
    expect(referralSource).toContain('app-referral-instruction');
  });

  it('shows referrals list with earned AEX', () => {
    expect(referralSource).toContain("t('referral.invited'");
    expect(referralSource).toContain('referrals');
    expect(referralSource).toContain('earnedAex');
    expect(referralSource).toContain('displayName');
  });

  it('renders transaction history with infinite scroll', () => {
    expect(referralSource).toContain('<q-infinite-scroll');
    expect(referralSource).toContain("t('referral.history')");
    expect(referralSource).toContain('loadMore');
    expect(referralSource).toContain('txHasMore');
  });

  it('displays transaction type icons and labels', () => {
    expect(referralSource).toContain('txTypeIcon');
    expect(referralSource).toContain('txTypeColor');
    expect(referralSource).toContain('txTypeLabel');
    expect(referralSource).toContain("referral.txType.");
  });

  it('has refresh button for transactions', () => {
    expect(referralSource).toContain('refreshTx');
    expect(referralSource).toContain("t('referral.refresh')");
    expect(referralSource).toContain('txRefreshing');
  });

  it('loads data on mount with parallel requests', () => {
    expect(referralSource).toContain('onMounted');
    expect(referralSource).toContain('loadReferral');
    expect(referralSource).toContain('loadFirstPage');
    expect(referralSource).toContain('Promise.all');
  });
});
