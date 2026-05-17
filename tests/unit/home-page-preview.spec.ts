import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const homePagePath = resolve(process.cwd(), 'src/pages/HomePage.vue');

describe('HomePage preview rates', () => {
  it('renders the all chip first through i18n', () => {
    const source = readFileSync(homePagePath, 'utf8');

    expect(source).toContain("t('home.all')");
  });

  it('keeps country and city filters in local state instead of hardcoded arrays', () => {
    const source = readFileSync(homePagePath, 'utf8');

    expect(source).toContain('const selectedCountry = ref<string | null>(null)');
    expect(source).toContain('const selectedCityId = ref<string | null>(null)');
    expect(source).not.toContain("const locationChips = ['Тайланд', 'Вьетнам', 'Грузия']");
  });

  it('keeps expand as inline action instead of exchange navigation', () => {
    const source = readFileSync(homePagePath, 'utf8');

    expect(source).not.toContain("router.push({ name: 'exchange' })");
    expect(source).toContain("t('home.expandRates')");
  });

  it('uses backend-prepared rate display values', () => {
    const source = readFileSync(homePagePath, 'utf8');

    expect(source).toContain('card.rateDisplay');
    expect(source).not.toContain('formatRateValue');
    expect(source).not.toContain('toFixed(');
  });

  it('passes backend-driven availableMethods into the order sheet context', () => {
    const source = readFileSync(homePagePath, 'utf8');

    expect(source).toContain('availableMethods: buildHomeAvailableMethods(selectedCityId.value)');
  });
});
