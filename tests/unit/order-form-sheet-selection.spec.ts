import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const orderFormSheetPath = resolve(process.cwd(), 'src/components/orders/OrderFormSheet.vue');
const source = readFileSync(orderFormSheetPath, 'utf8');

describe('OrderFormSheet selection sync contract', () => {
  it('uses order context only for the initial country seed', () => {
    expect(source).toContain('uiStore.orderContext?.country');
    expect(source).toContain(
      'getCountryByCurrency(exchangeStore.screen?.pairs ?? [], currencyBuy.value)',
    );
  });

  it('recomputes country from the selected buy currency after initialization', () => {
    expect(source).toContain('watch(currencyBuy, (value) => {');
    expect(source).toContain(
      'selectedCountry.value = getCountryByCurrency(exchangeStore.screen?.pairs ?? [], value);',
    );
    expect(source).not.toContain(
      'selectedCountry.value = uiStore.orderContext?.country\n    ?? getCountryByCurrency(exchangeStore.screen?.pairs ?? [], value);',
    );
  });

  it('prefers live quote methods over stale order context methods', () => {
    expect(source).toContain('quote.currencySell === selectedSellCurrency.value');
    expect(source).toContain('quote.currencyBuy === currencyBuy.value');
    expect(source).toContain('return uiStore.orderContext?.availableMethods ?? null;');
    expect(source).not.toContain('if (contextMethods?.length) {');
  });

  it('disables submit button when preliminary validation fails', () => {
    expect(source).toContain(
      '<AppButton block :loading="exchangeStore.submitting" :disable="!canSubmit" @click="submit">',
    );
  });

  it('repeat opening recalculates quote and focuses the sell amount field', () => {
    expect(source).toContain('ref="orderDetailsRef"');
    expect(source).toContain(
      'shouldFocusAmountSellAfterOpen.value = Boolean(uiStore.orderContext)',
    );
    expect(source).toContain('await nextTick();');
    expect(source).toContain('orderDetailsRef.value?.focusAmountSell();');
    expect(source).not.toContain('amountBuy.value = uiStore.orderContext?.amountBuy');
  });
});
