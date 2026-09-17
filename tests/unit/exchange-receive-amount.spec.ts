import { describe, expect, it } from 'vitest';

import { formatReadableNumber, parseExchangeAmount } from '../../src/utils/formatters';

describe('exchange receive amount input', () => {
  it('accepts localized positive amounts within configured precision', () => {
    expect(parseExchangeAmount('9 000,50', 2)).toBe(9000.5);
    expect(parseExchangeAmount('300.12345678', 8)).toBe(300.12345678);
  });

  it.each(['<script>', '-1', '1e3', '10.123'])('rejects unsafe or over-precise input %s', (value) => {
    expect(parseExchangeAmount(value, 2)).toBeNull();
  });

  it('shows the full sell precision returned by a reverse quote', () => {
    expect(formatReadableNumber(22630.12320845, 'ru', 8)).toBe('22 630,12320845');
  });
});
