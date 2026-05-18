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

  it('renders home rate flags and the localized rate prefix', () => {
    const source = readFileSync(homePagePath, 'utf8');

    expect(source).toContain('presentation.left.flag');
    expect(source).toContain('presentation.right.flag');
    expect(source).toContain("t('home.ratePrefix')");
  });

  it('keeps the home chips fully rounded through shared chip styles', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/css/app.scss'), 'utf8');
    const pageSource = readFileSync(homePagePath, 'utf8');

    expect(source).toContain('border-radius: var(--antex-radius-chip);');
    expect(source).toContain('overflow: hidden;');
    expect(source).toContain('box-shadow: inset 0 0 0 1px rgba(212, 175, 55, 0.9);');
    expect(source).toContain('.app-home-rates-card__chips');
    expect(source).toContain('padding: 2px 2px 4px 2px;');
    expect(source).toContain('z-index: 1;');
    expect(pageSource).toContain("class=\"app-home-country-chips app-home-rates-card__chips\"");
  });
});
