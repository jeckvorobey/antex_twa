import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('canonical AntEx design-system contract', () => {
  it('uses the live Penpot gold palette in Quasar and global tokens', () => {
    const config = read('quasar.config.ts');
    const styles = read('src/css/app.scss');

    expect(config).toContain("primary: '#FFB300'");
    expect(config).toContain("accent: '#F1C769'");
    expect(styles).toContain('--antex-gold-base: #ffb300;');
    expect(styles).toContain('--antex-gold-light: #f1c769;');
    expect(styles).toContain('--antex-gold-dark: #c79539;');

    for (const deprecated of ['#D4AF37', '#F2D27A', '#B8962E', '#d4af37', '#f2d27a', '#b8962e']) {
      expect(config).not.toContain(deprecated);
      expect(styles).not.toContain(deprecated);
    }
  });

  it('keeps default cards flat and elevation explicit', () => {
    const card = read('src/components/ui/AntexCard.vue');
    const styles = read('src/css/app.scss');

    expect(card).toContain("{ surface: 'default', padded: false, elevated: false, tag: 'div' }");
    expect(styles).toMatch(/--antex-shadow-card:\s*0 8px 24px rgba\(0,\s*0,\s*0,\s*0\.4\),\s*0 0 20px rgba\(255,\s*179,\s*0,\s*0\.06\);/);
  });

  it('uses the 172px Penpot OrderCard height by default', () => {
    const styles = read('src/css/app.scss');

    expect(styles).toMatch(/\.order-card\s*{[^}]*min-height:\s*172px;/s);
    expect(styles).toMatch(/\.antex-skeleton--order-card\s*{[^}]*min-height:\s*172px;/s);
    expect(styles).not.toMatch(/\.order-card\s*{[^}]*min-height:\s*184px;/s);
  });
});

