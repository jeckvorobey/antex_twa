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
    expect(source).toContain('AppFlagOptionButton');
    expect(source).toContain(':mark="country.flag"');
    expect(source).toContain(':mark="location.countryFlag"');
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
    expect(source).toContain('country: selectedCountry.value');
    expect(source).toContain('cityId: selectedCityId.value ? Number(selectedCityId.value) : null');
  });

  it('renders home rate currency marks through a dedicated component and the localized rate prefix', () => {
    const source = readFileSync(homePagePath, 'utf8');

    expect(source).toContain('AppCurrencyMark');
    expect(source).toContain(':mark="presentation.left.flag"');
    expect(source).toContain(':mark="presentation.right.flag"');
    expect(source).toContain("t('home.ratePrefix')");
  });

  it('keeps the referral banner hidden behind a local restore flag', () => {
    const source = readFileSync(homePagePath, 'utf8');

    expect(source).toContain('const showReferralBanner = false;');
    expect(source).toContain('v-if="showReferralBanner"');
  });

  it('renders social links after the primary exchange button and before services', () => {
    const source = readFileSync(homePagePath, 'utf8');

    const exchangeButtonIndex = source.indexOf('class="app-home-primary-button"');
    const socialTitleIndex = source.indexOf("t('home.social.title')");
    const servicesTitleIndex = source.indexOf("t('home.services')");

    expect(exchangeButtonIndex).toBeGreaterThan(-1);
    expect(socialTitleIndex).toBeGreaterThan(exchangeButtonIndex);
    expect(servicesTitleIndex).toBeGreaterThan(socialTitleIndex);
  });

  it('keeps social links frontend-only and opens them safely in a new tab', () => {
    const source = readFileSync(homePagePath, 'utf8');

    expect(source).toContain('const socialLinks');
    expect(source).toContain('https://t.me/+Rw2BRymXRnk1ZGUy');
    expect(source).toContain('https://t.me/+vN7FXrXBReszNDg1');
    expect(source).toContain('https://www.instagram.com/antex.change');
    expect(source).toContain('https://vk.ru/antex.finance');
    expect(source).toContain('https://max.ru/join/UgGFm4-mQ2lg33aJvK80IZwjxWGF3z-7QL61i-_CMVU');
    expect(source).toContain('https://www.threads.com/@antex.change?igshid=NTc4MTIwNjQ2YQ==');
    expect(source).toContain('target="_blank"');
    expect(source).toContain('rel="noopener noreferrer"');
    expect(source).not.toContain('/api/miniapp/home/social');
  });

  it('uses localized visible labels for social links', () => {
    const source = readFileSync(homePagePath, 'utf8');

    expect(source).toContain("t('home.social.title')");
    expect(source).toContain('t(link.titleKey)');
    expect(source).toContain('t(link.subtitleKey)');
    expect(source).toContain("titleKey: 'home.social.links.reviews.title'");
    expect(source).toContain("titleKey: 'home.social.links.news.title'");
    expect(source).toContain("titleKey: 'home.social.links.instagram.title'");
    expect(source).toContain("titleKey: 'home.social.links.vk.title'");
    expect(source).toContain("titleKey: 'home.social.links.max.title'");
    expect(source).toContain("titleKey: 'home.social.links.threads.title'");
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
