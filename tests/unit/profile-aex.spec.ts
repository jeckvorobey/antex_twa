import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const profilePath = resolve(process.cwd(), 'src/pages/ProfilePage.vue');
const profileSource = readFileSync(profilePath, 'utf8');

const i18nPath = resolve(process.cwd(), 'src/i18n/ru/index.ts');
const i18nSource = readFileSync(i18nPath, 'utf8');

describe('ProfilePage AEX integration', () => {
  it('shows AEX balance card', () => {
    expect(profileSource).toContain('app-profile-aex-card');
    expect(profileSource).toContain("t('profile.aexBalance')");
    expect(profileSource).toContain('aexBalance');
    expect(profileSource).toContain('AEX');
  });

  it('navigates to referral page on card click', () => {
    expect(profileSource).toContain('goToReferral');
    expect(profileSource).toContain("name: 'referral'");
  });

  it('reads balance from both aexStore and profileStore', () => {
    expect(profileSource).toContain('aexStore.balance');
    expect(profileSource).toContain('profileStore.data?.aex?.balance');
  });

  it('formats AEX amount with locale', () => {
    expect(profileSource).toContain('formatAex');
    expect(profileSource).toContain('toLocaleString');
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
