import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const componentPath = resolve(process.cwd(), 'src/components/ui/AppCurrencyMark.vue');

describe('AppCurrencyMark', () => {
  it('renders a dedicated tether svg for USDT and falls back to text marks otherwise', () => {
    const source = readFileSync(componentPath, 'utf8');

    expect(source).toContain("props.mark === 'USDT'");
    expect(source).toContain('viewBox="0 0 2000 2000"');
    expect(source).toContain('1122.5,869.6');
    expect(source).toContain('app-currency-mark__usdt');
    expect(source).toContain('{{ mark }}');
  });
});
