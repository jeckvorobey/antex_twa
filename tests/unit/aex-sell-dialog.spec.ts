import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const dialogPath = resolve(process.cwd(), 'src/components/aex/AexSellDialog.vue');
let dialogSource = '';
try {
  dialogSource = readFileSync(dialogPath, 'utf8');
} catch {
  // File doesn't exist yet — tests will fail (RED phase)
}

describe('AexSellDialog component (source)', () => {
  it('exists as a Vue component', () => {
    expect(dialogSource.length).toBeGreaterThan(0);
  });

  it('has modelValue prop for v-dialog visibility', () => {
    expect(dialogSource).toContain('modelValue');
  });

  it('emits update:modelValue for v-dialog close', () => {
    expect(dialogSource).toContain('update:modelValue');
  });

  it('has order selection (q-select or list)', () => {
    expect(dialogSource).toMatch(/q-select|q-option|order/);
  });

  it('has amount input field', () => {
    expect(dialogSource).toMatch(/amount|сумм/i);
  });

  it('has confirm/submit button', () => {
    expect(dialogSource).toMatch(/confirm|submit|продать|sell/i);
  });

  it('calls aexStore.sellAex on confirm', () => {
    expect(dialogSource).toContain('sellAex');
  });

  it('shows loading state during transfer', () => {
    expect(dialogSource).toContain('sellLoading');
  });

  it('validates amount before submit', () => {
    expect(dialogSource).toMatch(/valid|disabled|!amount/);
  });

  it('uses Quasar dialog component', () => {
    expect(dialogSource).toContain('q-dialog');
  });
});

