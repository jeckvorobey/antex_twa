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
  resolve(process.cwd(), 'src/components/ui/AntexBottomNav.vue'),
  'utf8',
);
const appStylesSource = readFileSync(resolve(process.cwd(), 'src/css/app.scss'), 'utf8');
const authStoreSource = readFileSync(resolve(process.cwd(), 'src/stores/auth.store.ts'), 'utf8');
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
    expect(bottomNavSource).toContain('<AntexCard');
    expect(bottomNavSource).toContain(':elevated="false"');
    expect(bottomNavSource).toContain('antex-bottom-nav__shell app-bottom-nav__shell');
    expect(bottomNavSource).toContain('<q-btn');
    expect(bottomNavSource).toContain('dense');
    expect(bottomNavSource).toContain('rounded');
    expect(bottomNavSource).toContain('size="10px"');
    expect(bottomNavSource).toContain('class="antex-bottom-nav__item app-bottom-nav__item"');
    expect(bottomNavSource).not.toMatch(/name:\s*'home'/);
    expect(authStoreSource).toMatch(/name:\s*'home'/);
    expect(bottomNavSource).toContain(
      'antex-bottom-nav app-bottom-nav fixed-bottom',
    );
    expect(bottomNavStyles).not.toContain('.q-btn__content');
    expect(bottomNavStyles).not.toContain('.block');
    expect(appStylesSource).toContain('.app-bottom-nav {');
  });

  it('registers the backend-addressable manager dashboard as the manager entry route', () => {
    expect(routesSource).toContain("name: 'managerDashboard'");
    expect(routesSource).toContain("component: () => import('@pages/manager/ManagerDashboardPage.vue')");
    expect(routesSource).toContain("redirect: { name: 'managerDashboard' }");
  });
});
