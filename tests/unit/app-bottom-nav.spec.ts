import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const componentPath = resolve(process.cwd(), 'src/components/ui/AppBottomNav.vue');
const homePagePath = resolve(process.cwd(), 'src/pages/HomePage.vue');
const mainLayoutPath = resolve(process.cwd(), 'src/layouts/MainLayout.vue');
const stylesPath = resolve(process.cwd(), 'src/css/app.scss');

describe('AppBottomNav', () => {
  it('uses stacked Quasar buttons so labels stay below icons', () => {
    const component = readFileSync(componentPath, 'utf8');

    expect(component).toContain('stack');
    expect(component).toContain('<q-icon v-else :name="item.icon"');
    expect(component).toContain('{{ item.label }}');
  });

  it('keeps the fixed nav inside the mobile screen width', () => {
    const component = readFileSync(componentPath, 'utf8');
    const styles = component.split('<style scoped lang="scss">')[1] ?? '';

    expect(component).toContain('<q-footer');
    expect(component).toContain('bottom-nav__safe-area');
    expect(styles).toContain('padding-bottom: var(--antex-safe-area-bottom)');
    expect(component).toContain('max-width: 308px');
    expect(component).toContain('q-pa-xs');
    expect(readFileSync(stylesPath, 'utf8')).not.toContain('.app-bottom-nav');
  });

  it('delegates compact icon and label sizing to Quasar', () => {
    const component = readFileSync(componentPath, 'utf8');
    const styles = component.split('<style scoped lang="scss">')[1] ?? '';

    expect(component).toContain('dense');
    expect(component).toContain('rounded');
    expect(component).toContain('size="sm"');
    expect(component).toContain(":text-color=\"isActive(item.name) ? 'primary' : 'white'\"");
    expect(component).toContain(`:aria-current="isActive(item.name) ? 'page' : undefined"`);
    expect(component).toContain('size="24px"');
    expect(component).toContain('text-caption');
    expect(styles).not.toContain('.q-btn__content');
    expect(styles).not.toContain('.q-icon');
    expect(styles).not.toContain('.block');
  });

  it('keeps labels reactive and skips navigation to the active route', () => {
    const component = readFileSync(componentPath, 'utf8');

    expect(component).toContain('const items = computed<NavigationItem[]>');
    expect(component).toContain('if (route.name === name)');
    expect(component).toContain('void router.push({ name })');
  });

  it('renders the browser fallback header from the shared layout only outside Telegram', () => {
    const layout = readFileSync(mainLayoutPath, 'utf8');
    const homePage = readFileSync(homePagePath, 'utf8');

    expect(layout).toContain('<AppHeaderBar v-if="!isTelegramMiniApp"');
    expect(homePage).not.toContain('<AppHeaderBar />');
  });

  it('removes the custom header shell and lets content follow Telegram chrome', () => {
    const styles = readFileSync(stylesPath, 'utf8');

    expect(styles).not.toContain('.app-header-shell {');
    expect(styles).not.toContain('.app-header-bar__logo');
    expect(styles).not.toContain('.app-header-bar__avatar');
    expect(styles).toContain('padding: var(--antex-content-safe-area-top)');
  });
});
