import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const routesSource = readFileSync(resolve(process.cwd(), 'src/router/routes.ts'), 'utf8');
const layoutSource = readFileSync(resolve(process.cwd(), 'src/layouts/MainLayout.vue'), 'utf8');
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
const telegramBootSource = readFileSync(resolve(process.cwd(), 'src/boot/telegram.ts'), 'utf8');
const initBootSource = readFileSync(resolve(process.cwd(), 'src/boot/init.ts'), 'utf8');
const indexSource = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
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

  it('uses a reusable localized Quasar back button in browser fallback header', () => {
    expect(backButtonSource).toContain('<q-btn');
    expect(backButtonSource).toContain('icon="arrow_back"');
    expect(backButtonSource).toContain(':aria-label="t(\'common.back\')"');
    expect(backButtonSource).toContain('defineEmits<{ click: [] }>()');
    expect(headerSource).toContain('<q-header');
    expect(headerSource).toContain('<q-toolbar');
    expect(headerSource).toContain('<AppBackButton v-if="backRouteName"');
  });

  it('uses native Telegram chrome and renders fallback header only outside Telegram', () => {
    expect(layoutSource).toContain('<AppHeaderBar v-if="!isTelegramMiniApp"');
    expect(layoutSource).not.toContain('app-header-shell');
    expect(headerSource).toContain("import AppBackButton from '@components/ui/AppBackButton.vue'");
    expect(headerSource).not.toContain('<q-img');
    expect(headerSource).not.toContain('<q-avatar');
    expect(headerSource).not.toContain('logoImage');
    expect(telegramBootSource).toContain('BackButton.show()');
    expect(telegramBootSource).toContain('BackButton.hide()');
    expect(telegramBootSource).toContain('router.afterEach');
  });

  it('initializes Telegram SDK lifecycle without blocking an ordinary browser', () => {
    expect(indexSource).not.toContain('telegram-web-app.js');
    expect(telegramBootSource).toContain('loadTelegramSdk');
    expect(telegramBootSource).toContain('TELEGRAM_SDK_TIMEOUT_MS');
    expect(telegramBootSource).toContain('window.setTimeout');
    expect(telegramBootSource).toContain('TELEGRAM_SDK_READY_EVENT');
    expect(telegramBootSource).toContain('window.dispatchEvent');
    expect(initBootSource).toContain('TELEGRAM_SDK_READY_EVENT');
    expect(initBootSource).toContain('initializeAuth');
    expect(layoutSource).toContain('computed(() => Boolean(telegramWebApp.value))');
    expect(telegramBootSource).toContain('script#${TELEGRAM_SDK_ID}');
    expect(telegramBootSource).toContain(
      "const TELEGRAM_SDK_SRC = 'https://telegram.org/js/telegram-web-app.js'",
    );
    expect(telegramBootSource).toContain('tg.expand()');
    expect(telegramBootSource).toContain("tg.setHeaderColor('#0F2A26')");
    expect(telegramBootSource).toContain("tg.setBackgroundColor('#1B342F')");
    expect(telegramBootSource).toContain("tg.isVersionAtLeast('7.10')");
    expect(telegramBootSource).toContain("tg.setBottomBarColor('#1B342F')");
    expect(initBootSource).toContain('markTelegramReady');
    expect(initBootSource).toContain('markTelegramReady()');
  });

  it('keeps four readable Quasar actions and Telegram profile identity in compact footer', () => {
    expect(bottomNavSource).toContain('<q-footer');
    expect(bottomNavSource).toContain('<q-card');
    expect(bottomNavSource).toContain('flat');
    expect(bottomNavSource).toContain('bordered');
    expect(bottomNavSource).toContain('class="bottom-nav__shell row no-wrap full-width q-pa-xs"');
    expect(bottomNavSource).toContain('style="max-width: 308px"');
    expect(bottomNavSource).toContain('<q-btn');
    expect(bottomNavSource).toContain('dense');
    expect(bottomNavSource).toContain('rounded');
    expect(bottomNavSource).toContain('size="sm"');
    expect(bottomNavSource).toContain('class="col"');
    expect(bottomNavSource).toContain('<q-avatar');
    expect(bottomNavSource).toContain('v-if="item.name === \'profile\'"');
    expect(bottomNavSource).toContain('v-if="userPhotoUrl"');
    expect(bottomNavSource).toContain('{{ userInitials }}');
    expect(bottomNavSource).toContain('size="24px"');
    expect(bottomNavSource).toContain('text-caption');
    expect(bottomNavSource).toMatch(/name:\s*'home'/);
    expect(bottomNavSource).toMatch(/name:\s*'exchange'/);
    expect(bottomNavSource).toMatch(/name:\s*'history'/);
    expect(bottomNavSource).toMatch(/name:\s*'profile'/);
    expect(bottomNavSource).toContain('bottom-nav__safe-area');
    expect(bottomNavStyles).toContain('var(--antex-safe-area-bottom)');
    expect(bottomNavStyles).not.toContain('.q-btn__content');
    expect(bottomNavStyles).not.toContain('.q-icon');
    expect(bottomNavStyles).not.toContain('.block');
    expect(appStylesSource).not.toContain('.app-bottom-nav');
  });

  it('uses Telegram and browser safe-area variables without fixed page compensation', () => {
    expect(appStylesSource).toContain('--antex-safe-area-bottom: max(');
    expect(appStylesSource).toContain('var(--tg-safe-area-inset-bottom, 0px)');
    expect(appStylesSource).toContain('var(--tg-content-safe-area-inset-bottom, 0px)');
    expect(appStylesSource).toContain('env(safe-area-inset-bottom, 0px)');
    expect(appStylesSource).toContain('var(--tg-viewport-stable-height, 100dvh)');
    expect(appStylesSource).not.toContain('calc(112px + env(safe-area-inset-bottom))');
    expect(appStylesSource).not.toContain('calc(104px + env(safe-area-inset-bottom))');
    expect(telegramBootSource).not.toContain('viewportHeight');
  });
});
