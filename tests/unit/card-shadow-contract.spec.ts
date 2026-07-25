import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const styles = readFileSync(resolve(process.cwd(), 'src/css/app.scss'), 'utf8');
const appSurface = readFileSync(resolve(process.cwd(), 'src/components/ui/AppSurface.vue'), 'utf8');
const homePage = readFileSync(resolve(process.cwd(), 'src/pages/HomePage.vue'), 'utf8');

describe('Mini App card shadow contract', () => {
  it('defines the profile card shadow once and exposes it through a global helper', () => {
    expect(styles).toMatch(
      /--antex-shadow-card:\s*0 8px 24px rgba\(0,\s*0,\s*0,\s*0\.4\),\s*0 0 20px rgba\(212,\s*175,\s*55,\s*0\.06\);/,
    );
    expect(styles).toMatch(/\.app-card-shadow\s*{\s*box-shadow:\s*var\(--antex-shadow-card\);/s);
  });

  it('applies the shared helper through AppSurface elevation', () => {
    expect(appSurface).toContain("elevated ? 'app-card-shadow' : null");
    expect(styles).not.toMatch(/\.app-surface--elevated\s*{\s*box-shadow:\s*0 8px/s);
  });

  it('keeps the card shadow token private to the helper class', () => {
    expect(styles.match(/var\(--antex-shadow-card\)/g)).toHaveLength(1);
  });

  it('applies the helper explicitly to card-like blocks outside AppSurface', () => {
    expect(homePage).toContain('class="app-home-rate-item app-card-shadow"');
  });

  it('keeps list card shadows visible inside vertical scroll containers', () => {
    expect(styles).toMatch(
      /\.app-history-scroll,\s*\.app-referral-tx-scroll\s*{[^}]*margin-inline:\s*calc\(var\(--antex-shadow-gutter\) \* -1\)[^}]*padding-inline:\s*var\(--antex-shadow-gutter\)/s,
    );
  });
});
