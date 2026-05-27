import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const layoutPath = resolve(process.cwd(), 'src/layouts/MainLayout.vue');
const loaderPath = resolve(process.cwd(), 'src/components/ui/AppPageLoader.vue');
const pagePaths = [
  'src/pages/HomePage.vue',
  'src/pages/ExchangePage.vue',
  'src/pages/HistoryPage.vue',
  'src/pages/ProfilePage.vue',
].map((path) => resolve(process.cwd(), path));

describe('AppPageLoader', () => {
  it('is rendered once by the shared layout above all page content', () => {
    const layout = readFileSync(layoutPath, 'utf8');

    expect(layout).toContain("import AppPageLoader from '@components/ui/AppPageLoader.vue'");
    expect(layout).toContain('<AppPageLoader :showing="pageLoading" />');
    expect(layout).toContain('const pageLoading = computed(() => {');
    expect(layout).toContain("case 'home':");
    expect(layout).toContain('return homeStore.loading || !homeStore.loaded;');
    expect(layout).toContain("case 'exchange':");
    expect(layout).toContain('return exchangeStore.loading || !exchangeStore.loaded;');
    expect(layout).toContain("case 'history':");
    expect(layout).toContain('return ordersStore.loading || !ordersStore.loaded;');
    expect(layout).toContain("case 'profile':");
    expect(layout).toContain('return profileStore.loading || !profileStore.loaded;');
  });

  it('uses the real logo asset and fullscreen overlay styling', () => {
    const loader = readFileSync(loaderPath, 'utf8');

    expect(loader).toContain("import logoUrl from '../../assets/images/logo.PNG'");
    expect(loader).toContain('class="app-page-loader"');
    expect(loader).toContain(':src="logoUrl"');
    expect(loader).toContain('Загружаем AntEx');
    expect(loader).toContain('Готовим актуальные курсы и ваши данные');
  });

  it('removes local page overlays so only the shared loader masks route data loads', () => {
    for (const path of pagePaths) {
      const source = readFileSync(path, 'utf8');

      expect(source).not.toContain('<q-inner-loading');
    }
  });
});
