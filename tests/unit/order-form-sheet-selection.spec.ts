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
    expect(source).toContain(':loading="exchangeStore.submitting || submitFlowPending"');
    expect(source).toContain(':disable="!canSubmit || submitFlowPending"');
  });

  it('repeat opening recalculates the quote without focusing the sell amount field', () => {
    expect(source).not.toContain('ref="orderDetailsRef"');
    expect(source).not.toContain('shouldFocusAmountSellAfterOpen');
    expect(source).not.toContain('orderDetailsRef.value?.focusAmountSell();');
    expect(source).not.toContain('amountBuy.value = uiStore.orderContext?.amountBuy');
  });

  it('refreshes manager availability before showing offline confirmation', () => {
    expect(source).toContain('shouldConfirmOfflineSubmit');
    expect(source).toContain('<AppOfflineNotice');
    expect(source).toContain(':business-hours=');
    expect(source).toContain("{{ t('order.offlineInlineTitle') }}");
    expect(source).toContain("{{ t('order.offlineInlineNotice') }}");
    expect(source).toContain('persistent');
    expect(source).toContain('class="app-dialog--confirm"');
    expect(source).not.toContain('v-model="offlineConfirmVisible" position="bottom" persistent');
    expect(source).toContain('await exchangeStore.refreshManagerAvailability()');
    expect(source).not.toContain(
      'await exchangeStore.refresh();\n    refreshQuoteForCurrentState();',
    );
    expect(source).toContain('const refreshedValidation = preliminaryValidation.value;');
    expect(source).toContain("managerAvailability.status === 'offline'");
    expect(source).toContain('if (submitFlowPending.value)');
    expect(source).toContain('@click="cancelOffline"');
    expect(source).toContain('resetFormToDefaults({ clearContext: true });');
    expect(source).toContain('uiStore.orderContext = null;');
    expect(source).toContain('class="app-sheet__header"');
    expect(source).toContain('ref="sheetScrollRef" class="app-sheet__scroll"');
    expect(source).toContain('@touchstart.passive="startSheetDrag"');
    expect(source).toContain('@touchmove="trackSheetDrag"');
    expect(source).toContain('@touchend="finishSheetDrag"');
    expect(source).toContain('@touchcancel="cancelSheetDrag"');
    expect(source).toMatch(
      /<AppSurface[\s\S]*@touchstart\.passive="startSheetDrag"[\s\S]*@touchmove="trackSheetDrag"[\s\S]*@touchend="finishSheetDrag"/,
    );
    expect(source).not.toContain('@touchmove.stop.prevent="trackSheetDrag"');
    expect(source).toContain(':style="sheetDragStyle"');
    expect(source).toContain('transform: `translate3d(0, ${sheetDragDeltaY.value}px, 0)`');
    expect(source).toContain('(sheetScrollRef.value?.scrollTop ?? 0) > 0');
    expect(source).toContain('await new Promise((resolve) => window.setTimeout(resolve, 240));');
    expect(source).toContain('resetAndCloseSheet();');
    expect(source).toContain(
      "catch {\n    return exchangeStore.screen?.managerAvailability.status === 'offline';",
    );
  });

  it('keeps the submit button in the scrollable form flow', () => {
    expect(source).toMatch(
      /<div ref="sheetScrollRef" class="app-sheet__scroll">[\s\S]*<ExchangeOrderDetails[\s\S]*<AppButton[\s\S]*{{ t\('common.submit'\) }}[\s\S]*<\/div>\s*<\/AppSurface>/,
    );
    expect(source).not.toContain('class="q-mt-md q-mb-md"');
  });
});
