export const MIN_AMOUNT_BY_METHOD: Record<string, Record<string, number>> = {
  cash: { RUB: 25_000, USDT: 500 },
  qrcode: { RUB: 15_000, USDT: 300 },
  bank_account: { RUB: 5_000, USDT: 100 },
  pay_services: { RUB: 5_000, USDT: 100 },
};

export function getMinAmount(method: string, currency: string): number {
  const normalizedCurrency = currency.toUpperCase();
  const limitCurrency = normalizedCurrency === 'ATXG' ? 'USDT' : normalizedCurrency;
  return MIN_AMOUNT_BY_METHOD[method]?.[limitCurrency] ?? 0;
}
