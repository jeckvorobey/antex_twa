import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const homePagePath = resolve(process.cwd(), 'src/pages/HomePage.vue');

describe('HomePage preview rates', () => {
  it('renders the all chip first through i18n', () => {
    const source = readFileSync(homePagePath, 'utf8');

    expect(source).toContain("t('home.all')");
  });

  it('keeps expand as inline action instead of exchange navigation', () => {
    const source = readFileSync(homePagePath, 'utf8');

    expect(source).not.toContain("router.push({ name: 'exchange' })");
    expect(source).toContain("t('home.expandRates')");
  });
});
