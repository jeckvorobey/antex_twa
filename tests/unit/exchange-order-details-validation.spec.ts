import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const detailsPath = resolve(process.cwd(), 'src/components/orders/ExchangeOrderDetails.vue');
const source = readFileSync(detailsPath, 'utf8');

describe('ExchangeOrderDetails validation contract', () => {
  it('displays error via q-input native :error/:error-message props on validation failure', () => {
    expect(source).toContain('amountSellError');
    expect(source).toContain(':error="!!amountSellError"');
    expect(source).toContain(':error-message="amountSellError ?? undefined"');
  });

  it('validates amountSell against minAmount via custom validateAmountSell function', () => {
    expect(source).toContain('function validateAmountSell()');
    expect(source).toContain('if (minAmount.value > 0 && val < minAmount.value)');
    expect(source).toContain("t('errors.exchange_min_amount', {");
  });

  it('re-validates amountSell when amountSell or minAmount changes', () => {
    expect(source).toContain('watch(() => props.amountSell, validateAmountSell)');
    expect(source).toContain('watch(minAmount, validateAmountSell)');
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
