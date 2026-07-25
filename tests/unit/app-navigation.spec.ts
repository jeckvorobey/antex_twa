import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const routesSource = readFileSync(resolve(process.cwd(), 'src/router/routes.ts'), 'utf8');
const headerSource = readFileSync(
  resolve(process.cwd(), 'src/components/ui/AppHeaderBar.vue'),
  'utf8',
);
const backButtonSource = readFileSync(
  resolve(process.cwd(), 'src/components/ui/AppBackButton.vue'),
  'utf8',
);
const bottomNavSource = readFileSync(
  resolve(process.cwd(), 'src/components/ui/AppBottomNav.vue'),
  'utf8',
);
const appStylesSource = readFileSync(resolve(process.cwd(), 'src/css/app.scss'), 'utf8');
const bottomNavStyles = bottomNavSource.split('<style scoped lang="scss">')[1] ?? '';

describe('app navigation chrome', () => {
  it('keeps route pages lazy and declares deterministic referral back targets', () => {
    expect(routesSource).toContain("component: () => import('@pages/ReferralPage.vue')");
    expect(routesSource).toContain("component: () => import('@pages/ReferralReferralsPage.vue')");
    expect(routesSource).toContain("component: () => import('@pages/ReferralOperationsPage.vue')");
    expect(routesSource).toMatch(/name:\s*'referral',[\s\S]*backRouteName:\s*'profile'/);
    expect(routesSource).toMatch(/name:\s*'referralReferrals',[\s\S]*backRouteName:\s*'referral'/);
    expect(routesSource).toMatch(/name:\s*'referralOperations',[\s\S]*backRouteName:\s*'referral'/);
  });

  it('uses a reusable localized Quasar back button', () => {
    expect(backButtonSource).toContain('<q-btn');
    expect(backButtonSource).toContain('icon="arrow_back"');
    expect(backButtonSource).toContain(':aria-label="t(\'common.back\')"');
    expect(backButtonSource).toContain('defineEmits<{ click: [] }>()');
  });

  it('centers the brand only when back navigation is visible and keeps avatar right', () => {
    expect(headerSource).toContain("import AppBackButton from '@components/ui/AppBackButton.vue'");
    expect(headerSource).toContain('v-if="backRouteName"');
    expect(headerSource).toContain("'app-header-bar--with-back': backRouteName");
    expect(headerSource).toContain('<q-avatar');
    expect(headerSource).toContain('openProfile');
  });

  it('keeps four Quasar navigation actions inside a narrower compact shell', () => {
    expect(bottomNavSource).toContain('<q-card');
    expect(bottomNavSource).toContain('flat');
    expect(bottomNavSource).toContain('bordered');
    expect(bottomNavSource).toContain('class="app-bottom-nav__shell row no-wrap q-pa-sm"');
    expect(bottomNavSource).toContain('<q-btn');
    expect(bottomNavSource).toContain('dense');
    expect(bottomNavSource).toContain('size="sm"');
    expect(bottomNavSource).toContain("'app-bottom-nav__item col'");
    expect(bottomNavSource).toContain("{ name: 'home'");
    expect(bottomNavSource).toContain("{ name: 'exchange'");
    expect(bottomNavSource).toContain("{ name: 'history'");
    expect(bottomNavSource).toContain("{ name: 'profile'");
    expect(bottomNavStyles).toMatch(/\.app-bottom-nav\s*{[^}]*max-width:\s*344px/s);
    expect(bottomNavStyles).toContain(
      'bottom: calc(env(safe-area-inset-bottom) + var(--antex-space-sm))',
    );
    expect(bottomNavStyles).not.toContain('.app-bottom-nav__shell {\n  padding:');
    expect(bottomNavStyles).not.toContain('.app-bottom-nav__item .q-btn__content');
    expect(bottomNavStyles).not.toContain('.app-bottom-nav__item .q-icon');
    expect(bottomNavStyles).not.toContain('.app-bottom-nav__item .block');
    expect(appStylesSource).not.toContain('.app-bottom-nav');
  });
});
