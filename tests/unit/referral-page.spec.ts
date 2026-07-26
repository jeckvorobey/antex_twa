import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const referralPagePath = resolve(process.cwd(), 'src/pages/ReferralPage.vue');
const referralSource = readFileSync(referralPagePath, 'utf8');

describe('ReferralPage structure', () => {
  it('renders shared balance hero with token currency label', () => {
    expect(referralSource).toContain('<AexBalanceCard');
    expect(referralSource).toContain(':balance="availableBalance"');
    expect(referralSource).toContain(':label="t(\'referral.balanceLabel\')"');
  });

  it('shows available balance separately from reserved amount', () => {
    expect(referralSource).toContain('return b.available;');
    expect(referralSource).toContain('return b.reserved;');
    expect(referralSource).not.toContain('return b.totalEarned;');
    expect(referralSource).not.toContain('b.totalEarned - b.totalWithdrawn - b.available');
  });

  it('does not render a standalone referral code field', () => {
    expect(referralSource).not.toContain("t('referral.yourCode')");
    expect(referralSource).not.toContain('app-referral-code-card__code-row');
    expect(referralSource).not.toContain('app-referral-code-card__code');
    expect(referralSource).not.toContain('copyCode');
  });

  it('keeps referral link copy and share actions compact in the referral card', () => {
    expect(referralSource).toContain('referralLink');
    expect(referralSource).toContain('shareLink');
    expect(referralSource).toContain('copyLink');
    expect(referralSource).toContain("t('referral.referralLinkLabel')");
    expect(referralSource).toContain('icon="share"');
    expect(referralSource).toContain(':aria-label="t(\'referral.share\')"');
    expect(referralSource).toContain("t('referral.copyLink')");
    expect(referralSource).not.toContain('<AppButton block color="warning" icon="share"');
  });

  it('uses the ready referral link returned by backend', () => {
    expect(referralSource).toContain(
      "const referralLink = computed(() => aexStore.referralInfo?.referralLink ?? '')",
    );
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

  it('renders instruction card icon and title in one row', () => {
    expect(referralSource).toContain('class="row items-center no-wrap"');
    expect(referralSource).toContain('class="q-mr-sm"');
    expect(referralSource).not.toContain('class="q-mt-sm text-weight-medium"');
  });

  it('renders program terms from backend config', () => {
    expect(referralSource).toContain('programConfig');
    expect(referralSource).toContain("t('referral.termsTitle')");
    expect(referralSource).toContain("t('referral.terms.referralPercent')");
    expect(referralSource).toContain("t('referral.terms.referralMinWithdraw')");
    expect(referralSource).toContain("t('referral.terms.referralMaxWithdraw')");
    expect(referralSource).toContain("t('referral.terms.aexRate')");
    expect(referralSource).toContain("t('referral.noLimit')");
    expect(referralSource).toContain('parseDecimal(programConfig.value.aexWithdrawLimit)');
    expect(referralSource).not.toContain("t('referral.terms.aexWithdrawLimit')");
    expect(referralSource).not.toContain('parseDecimal(programConfig.value.referralMinWithdraw)');
  });

  it('does not render redundant earnings examples block', () => {
    expect(referralSource).not.toContain("t('referral.earningsTitle')");
    expect(referralSource).not.toContain('earningsRows');
    expect(referralSource).not.toContain('app-referral-earnings');
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

  it('renders referral detail menu instead of inline transaction history', () => {
    expect(referralSource).toContain("t('referral.myReferrals')");
    expect(referralSource).toContain("t('referral.history')");
    expect(referralSource).toContain("name: 'referralReferrals'");
    expect(referralSource).toContain("name: 'referralOperations'");
    expect(referralSource).not.toContain('<q-infinite-scroll');
    expect(referralSource).not.toContain('txHasMore');
  });

  it('renders the fifth instruction with exchange route link', () => {
    expect(referralSource).toContain("t('referral.instructionStep5DescriptionPrefix')");
    expect(referralSource).toContain("t('referral.instructionStep5ExchangeLink')");
    expect(referralSource).toContain("t('referral.instructionStep5DescriptionSuffix')");
    expect(referralSource).toContain("name: 'exchange'");
  });

  it('loads data on mount with parallel requests', () => {
    expect(referralSource).toContain('onMounted');
    expect(referralSource).toContain('loadReferral');
    expect(referralSource).toContain('Promise.all');
  });
});
