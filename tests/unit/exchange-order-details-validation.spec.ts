import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const detailsPath = resolve(process.cwd(), 'src/components/orders/ExchangeOrderDetails.vue');
const source = readFileSync(detailsPath, 'utf8');

describe('ExchangeOrderDetails validation contract', () => {
  it('uses rules prop for validation on amountSell input', () => {
    expect(source).toContain(':rules="amountSellRules"');
    expect(source).toContain('lazy-rules');
  });

  it('enables bottom-slots with hide-bottom-space for compact error display', () => {
    expect(source).toContain('bottom-slots');
    expect(source).toContain('hide-bottom-space');
  });

  it('computes amountSellRules with minAmount validation', () => {
    expect(source).toContain('const amountSellRules = computed(() => [');
    expect(source).toContain('if (minAmount.value > 0 && amount < minAmount.value)');
    expect(source).toContain("return t('errors.exchange_min_amount', {");
  });

  it('auto-sets minimum amount when method changes', () => {
    expect(source).toContain('() => props.selectedMethod,');
    expect(source).toContain("emit('update:amountSell', min);");
  });

  it('auto-sets minimum amount when sell currency changes', () => {
    expect(source).toContain('() => props.selectedSellCurrency,');
  });

  it('runs watches immediately to enforce minimum on initialization', () => {
    expect(source).toContain('() => props.selectedMethod,');
    expect(source).toContain('() => props.selectedSellCurrency,');
    expect(source).toContain('{ immediate: true }');
  });
});
