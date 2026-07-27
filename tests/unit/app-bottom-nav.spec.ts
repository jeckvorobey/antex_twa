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
    expect(component).toContain(':icon="item.icon"');
    expect(component).toContain(':label="item.label"');
  });

  it('keeps the fixed nav inside the mobile screen width', () => {
    const component = readFileSync(componentPath, 'utf8');
    const appStyles = readFileSync(stylesPath, 'utf8');

    expect(component).toContain(
      'app-bottom-nav fixed-bottom row justify-center q-px-sm q-pb-sm z-top',
    );
    expect(component).toContain('margin-bottom: env(safe-area-inset-bottom)');
    expect(component).toContain('max-width: 322px');
    expect(component).toContain('q-pa-xs');
    expect(appStyles).toContain('.app-bottom-nav {');
  });

  it('keeps button size compact and delegates visual icon/label emphasis to CSS', () => {
    const component = readFileSync(componentPath, 'utf8');
    const appStyles = readFileSync(stylesPath, 'utf8');

    expect(component).toContain('dense');
    expect(component).toContain('rounded');
    expect(component).toContain('size="10px"');
    expect(component).toContain(":text-color=\"isActive(item.name) ? 'primary' : 'white'\"");
    expect(component).toContain(`:aria-current="isActive(item.name) ? 'page' : undefined"`);
    expect(component).not.toContain('.q-btn__content');
    expect(component).not.toContain('.block');
    expect(appStyles).toContain('.app-bottom-nav__item .q-icon {');
    expect(appStyles).toContain('font-size: 21px;');
    expect(appStyles).toContain('.app-bottom-nav__item .q-btn__content > span:not(.q-icon)');
    expect(appStyles).toContain('font-size: 11.5px;');
  });

  it('adds premium first-mount reveal, stagger, active focus and reduced motion CSS', () => {
    const component = readFileSync(componentPath, 'utf8');
    const appStyles = readFileSync(stylesPath, 'utf8');

    expect(component).toContain('v-for="(item, index) in items"');
    expect(component).toContain('app-bottom-nav__item col q-py-sm');
    expect(component).toContain('`${index * 60}ms`');
    expect(appStyles).toContain('@keyframes app-bottom-nav-velvet-reveal');
    expect(appStyles).toContain('@keyframes app-bottom-nav-item-reveal');
    expect(appStyles).toContain('translate3d(0, 22px, 0) scale(0.97)');
    expect(appStyles).toContain('animation-delay: calc(160ms + var(--bottom-nav-item-delay, 0ms))');
    expect(appStyles).toContain('.app-bottom-nav__item.bottom-nav__item--active .q-icon');
    expect(appStyles).toContain('@media (prefers-reduced-motion: reduce)');
  });

  it('keeps labels reactive and skips navigation to the active route', () => {
    const component = readFileSync(componentPath, 'utf8');

    expect(component).toContain('const items = computed<NavigationItem[]>');
    expect(component).toContain('if (route.name === name)');
    expect(component).toContain('void router.push({ name })');
  });

  it('renders the header from the shared layout on every page', () => {
    const layout = readFileSync(mainLayoutPath, 'utf8');
    const homePage = readFileSync(homePagePath, 'utf8');

    expect(layout).toContain('<AppHeaderBar />');
    expect(homePage).not.toContain('<AppHeaderBar />');
  });

  it('renders the shared header as a regular centered block with top inset', () => {
    const styles = readFileSync(stylesPath, 'utf8');

    expect(styles).toContain('.app-header-shell {');
    expect(styles).toContain('position: relative;');
    expect(styles).toContain(
      'margin: calc(env(safe-area-inset-top) + var(--antex-space-md)) auto 0',
    );
    expect(styles).toContain('width: min(calc(100vw - (var(--antex-space-md) * 2)), 390px)');
    expect(styles).toContain('transform: none;');
  });
});
