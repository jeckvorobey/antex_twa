import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const styles = readFileSync(resolve(process.cwd(), 'src/css/app.scss'), 'utf8');
const antexCard = readFileSync(resolve(process.cwd(), 'src/components/ui/AntexCard.vue'), 'utf8');
const homePage = readFileSync(resolve(process.cwd(), 'src/pages/HomePage.vue'), 'utf8');
const exchangePage = readFileSync(resolve(process.cwd(), 'src/pages/ExchangePage.vue'), 'utf8');

describe('Mini App card shadow contract', () => {
  it('defines the profile card shadow once and exposes it through a global helper', () => {
    expect(styles).toMatch(
      /--antex-shadow-card:\s*0 8px 24px rgba\(0,\s*0,\s*0,\s*0\.4\),\s*0 0 20px rgba\(255,\s*179,\s*0,\s*0\.06\);/,
    );
    expect(styles).toMatch(/\.app-card-shadow\s*{\s*box-shadow:\s*var\(--antex-shadow-card\);/s);
  });

  it('applies the shared helper through AntexCard elevation', () => {
    expect(antexCard).toContain("'app-card-shadow': elevated");
    expect(styles).not.toMatch(/\.app-surface--elevated\s*{\s*box-shadow:\s*0 8px/s);
  });

  it('keeps card shadows tokenized for the primitive and compatibility helper', () => {
    expect(styles.match(/var\(--antex-shadow-card\)/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it('applies the helper explicitly to card-like blocks outside AntexCard', () => {
    expect(homePage).toContain('class="app-home-rate-item app-card-shadow"');
  });

  it('keeps list card shadows visible inside vertical scroll containers', () => {
    expect(styles).toMatch(
      /\.app-history-scroll,\s*\.app-referral-tx-scroll\s*{[^}]*margin-inline:\s*calc\(var\(--antex-shadow-gutter\) \* -1\)[^}]*padding-inline:\s*var\(--antex-shadow-gutter\)/s,
    );
  });

  it('does not clip AntexCard shadows on exchange and home screens', () => {
    expect(exchangePage).not.toContain(
      'app-exchange-content col column q-gutter-md no-wrap overflow-hidden',
    );
    expect(styles).not.toMatch(/\.app-page--exchange\s*{[^}]*overflow:\s*hidden/s);
    expect(styles).not.toMatch(/\.shadow-radius\s*{[^}]*overflow:\s*hidden/s);
  });

  it('removes obsolete card styles that are no longer used by components', () => {
    for (const legacyClass of [
      '.app-quick-card',
      '.app-quick-grid',
      '.app-service-grid',
      '.app-service-card',
      '.app-location-grid',
      '.app-location-card',
      '.app-bonus-banner',
      '.app-calc-card',
      '.app-calc-block',
      '.app-rate-scroll',
      '.app-rate-card',
      '.app-home-overview',
      '.app-home-quick-card',
      '.app-home-stat-card',
      '.app-home-location-card',
    ]) {
      expect(styles).not.toContain(legacyClass);
    }
  });
});
