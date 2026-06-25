import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const profilePath = resolve(process.cwd(), 'src/pages/ProfilePage.vue');
const profileSource = readFileSync(profilePath, 'utf8');

const referralPath = resolve(process.cwd(), 'src/pages/ReferralPage.vue');
const referralSource = readFileSync(referralPath, 'utf8');

const balanceCardPath = resolve(process.cwd(), 'src/components/ui/AexBalanceCard.vue');
const balanceCardSource = readFileSync(balanceCardPath, 'utf8');

const appStylesPath = resolve(process.cwd(), 'src/css/app.scss');
const appStylesSource = readFileSync(appStylesPath, 'utf8');

const i18nPath = resolve(process.cwd(), 'src/i18n/ru/index.ts');
const i18nSource = readFileSync(i18nPath, 'utf8');

describe('AexBalanceCard shared component', () => {
  it('owns the AEX balance card layout, label, amount formatting and currency mark', () => {
    expect(balanceCardSource).toContain('<AppSurface');
    expect(balanceCardSource).toContain('padded');
    expect(balanceCardSource).toContain('app-aex-balance-card');
    expect(balanceCardSource).toContain('displayLabel');
    expect(balanceCardSource).toContain('formattedBalance');
    expect(balanceCardSource).toContain('toLocaleString');
    expect(balanceCardSource).toContain('AEX');
  });

  it('keeps the card reusable with optional label and click behavior props', () => {
    expect(balanceCardSource).toContain('label?: string');
    expect(balanceCardSource).toContain('clickable?: boolean');
    expect(balanceCardSource).toContain("emit('click')");
  });
});

describe('ProfilePage AEX integration', () => {
  it('uses the shared AexBalanceCard instead of inline balance markup', () => {
    expect(profileSource).toContain("import AexBalanceCard from '@components/ui/AexBalanceCard.vue'");
    expect(profileSource).toContain('<AexBalanceCard');
    expect(profileSource).toContain(':balance="aexBalance"');
    expect(profileSource).not.toContain('app-profile-aex-card');
  });

  it('navigates to referral page on card click', () => {
    expect(profileSource).toContain('clickable');
    expect(profileSource).toContain('@click="goToReferral"');
    expect(profileSource).toContain("name: 'referral'");
  });

  it('reads balance from both aexStore and profileStore', () => {
    expect(profileSource).toContain('aexStore.balance');
    expect(profileSource).toContain('profileStore.data?.aex?.balance');
  });
});

describe('ReferralPage AEX integration', () => {
  it('uses the same shared AexBalanceCard with the referral balance label', () => {
    expect(referralSource).toContain("import AexBalanceCard from '@components/ui/AexBalanceCard.vue'");
    expect(referralSource).toContain('<AexBalanceCard');
    expect(referralSource).toContain(':balance="availableBalance"');
    expect(referralSource).toContain(":label=\"t('referral.balanceLabel')\"");
    expect(referralSource).not.toContain('app-referral-balance">');
  });

  it('adds a top gap between the page header area and the balance card', () => {
    expect(appStylesSource).toMatch(/\.app-screen--referral\s*{[^}]*padding-top:\s*var\(--antex-space-md\)/s);
  });
});

describe('i18n referral keys', () => {
  it('has all required referral translation keys', () => {
    expect(i18nSource).toContain("balanceLabel: 'Ваш баланс'");
    expect(i18nSource).toContain("yourCode: 'Ваш реферальный код'");
    expect(i18nSource).toContain("copyCode: 'Копировать код'");
    expect(i18nSource).toContain("copyLink: 'Копировать ссылку'");
    expect(i18nSource).toContain('invited:');
    expect(i18nSource).toContain('noReferrals:');
    expect(i18nSource).toContain('noTransactions:');
    expect(i18nSource).toContain('shareText:');
  });

  it('has instruction translation keys', () => {
    expect(i18nSource).toContain("howItWorks: 'Как это работает'");
    expect(i18nSource).toContain('instructionStep1:');
    expect(i18nSource).toContain('instructionStep2:');
    expect(i18nSource).toContain('instructionStep3:');
    expect(i18nSource).toContain('instructionReward:');
  });

  it('has transaction type translation keys', () => {
    expect(i18nSource).toContain('txType:');
    expect(i18nSource).toContain("referral_reward: 'Реферальное вознаграждение'");
    expect(i18nSource).toContain("withdrawal: 'Вывод'");
    expect(i18nSource).toContain("bonus: 'Бонус'");
    expect(i18nSource).toContain("adjustment: 'Корректировка'");
  });

  it('has profile AEX balance key', () => {
    expect(i18nSource).toContain("aexBalance: 'Баланс AEX'");
  });
});
