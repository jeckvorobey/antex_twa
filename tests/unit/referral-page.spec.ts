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

  it('uses the ready referral link returned by backend', () => {
    expect(referralSource).toContain('const referralLink = computed(() => aexStore.referralInfo?.referralLink ?? \'\')');
    expect(referralSource).not.toContain('startapp=ref_');
    expect(referralSource).not.toContain('VITE_TELEGRAM_BOT_USERNAME');
  });

  it('renders instruction section with 5 step cards', () => {
    expect(referralSource).toContain("t('referral.howItWorks')");
    expect(referralSource).toContain("t('referral.instructionStep1')");
    expect(referralSource).toContain("t('referral.instructionStep2')");
    expect(referralSource).toContain("t('referral.instructionStep3')");
    expect(referralSource).toContain("t('referral.instructionStep4')");
    expect(referralSource).toContain("t('referral.instructionStep5')");
    expect(referralSource).toContain('instructionSteps');
    expect(referralSource).toContain('app-referral-step-card');
    expect(referralSource).toContain('app-referral-instruction');
  });

  it('renders program terms from backend config', () => {
    expect(referralSource).toContain('programConfig');
    expect(referralSource).toContain("t('referral.termsTitle')");
    expect(referralSource).toContain("t('referral.terms.referralPercent')");
    expect(referralSource).toContain("t('referral.terms.referralMinWithdraw')");
    expect(referralSource).toContain("t('referral.terms.referralMaxWithdraw')");
    expect(referralSource).toContain("t('referral.terms.aexRate')");
    expect(referralSource).toContain("t('referral.noLimit')");
  });

  it('renders dynamic earnings examples without hardcoded rate copy', () => {
    expect(referralSource).toContain("t('referral.earningsTitle')");
    expect(referralSource).toContain('earningsRows');
    expect(referralSource).toContain('gt-xs');
    expect(referralSource).toContain('lt-sm');
    expect(referralSource).toContain('referralPercentValue');
    expect(referralSource).not.toContain('0.2%');
  });

  it('shows only total referrals summary without personal referral list', () => {
    expect(referralSource).toContain("t('referral.invited'");
    expect(referralSource).not.toContain('const referrals = computed');
    expect(referralSource).not.toContain('earnedAex');
    expect(referralSource).not.toContain('displayName');
    expect(referralSource).not.toContain('joinedAt');
  });

  it('renders total referrals inline with the invited header', () => {
    expect(referralSource).toContain('app-referral-info-card__header-count');
    expect(referralSource).toContain('justify-between');
    expect(referralSource).not.toContain('app-referral-info-card__stats q-mt-sm');
    expect(referralSource).toContain('aexStore.totalReferrals === 0');
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
    expect(referralSource).toContain('!aexStore.txLoaded || !aexStore.transactions.length');
    expect(referralSource).toContain('Promise.all');
  });
});
