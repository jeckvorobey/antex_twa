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
    const styles = component.split('<style scoped lang="scss">')[1] ?? '';

    expect(styles).toContain('left: 50%');
    expect(styles).toContain('transform: translateX(-50%)');
    expect(styles).toContain('bottom: calc(env(safe-area-inset-bottom) + var(--antex-space-sm))');
    expect(styles).toContain('max-width: 344px');
    expect(readFileSync(stylesPath, 'utf8')).not.toContain('.app-bottom-nav');
  });

  it('delegates compact icon and label sizing to Quasar', () => {
    const component = readFileSync(componentPath, 'utf8');
    const styles = component.split('<style scoped lang="scss">')[1] ?? '';

    expect(component).toContain('dense');
    expect(component).toContain('size="sm"');
    expect(component).toContain(":text-color=\"isActive(item.name) ? 'primary' : 'white'\"");
    expect(styles).not.toContain('.app-bottom-nav__item .q-btn__content');
    expect(styles).not.toContain('.app-bottom-nav__item .q-icon');
    expect(styles).not.toContain('.app-bottom-nav__item .block');
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
