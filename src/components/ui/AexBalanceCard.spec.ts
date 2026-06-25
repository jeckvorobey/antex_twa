import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function readProjectFile(path: string): string {
  return readFileSync(`${process.cwd()}/${path}`, 'utf8');
}

describe('AexBalanceCard reuse contract', () => {
  it('is used by referral and profile pages instead of inline balance markup', () => {
    const referralPage = readProjectFile('src/pages/ReferralPage.vue');
    const profilePage = readProjectFile('src/pages/ProfilePage.vue');

    expect(referralPage).toContain("import AexBalanceCard from '@components/ui/AexBalanceCard.vue'");
    expect(referralPage).toContain('<AexBalanceCard');
    expect(profilePage).toContain("import AexBalanceCard from '@components/ui/AexBalanceCard.vue'");
    expect(profilePage).toContain('<AexBalanceCard');
  });

  it('owns the card inner padding and referral header-to-card gap', () => {
    const styles = readProjectFile('src/css/app.scss');
    const referralPage = readProjectFile('src/pages/ReferralPage.vue');

    expect(styles).toMatch(/\.app-aex-balance-card\s*{[^}]*padding:\s*16px/s);
    expect(referralPage).toContain('app-referral-balance-card');
    expect(styles).toMatch(/\.app-referral-balance-card\s*{[^}]*margin-top:\s*8px/s);
  });
});
