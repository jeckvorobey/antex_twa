import type { GroupedOrders, MiniappOrderItem, MiniappQuoteResponse } from '@types/miniapp';
import { groupItemsByDate } from '@utils/date-groups';

type QuoteParams = {
  currencySell: string;
  currencyBuy: string;
  amountSell: number | null;
};

const STATUS_LABELS: Record<number, string> = {
  1: 'status.new',
  2: 'status.processing',
  3: 'status.completed',
  4: 'status.cancelled',
};

const STATUS_TONES: Record<number, string> = {
  1: 'warning',
  2: 'info',
  3: 'positive',
  4: 'negative',
};

export function getStatusLabelKey(status: number) {
  return STATUS_LABELS[status] ?? 'status.new';
}

export function getStatusTone(status: number) {
  return STATUS_TONES[status] ?? 'warning';
}

export function groupOrdersByDate(items: MiniappOrderItem[]) {
  return groupItemsByDate(items, (item) => item.createdAt, 'ru') as GroupedOrders[];
}

export function isQuoteCurrent(quote: MiniappQuoteResponse | null, params: QuoteParams) {
  if (!quote || !params.amountSell || params.amountSell <= 0) {
    return false;
  }

  return (
    quote.currencySell === params.currencySell &&
    quote.currencyBuy === params.currencyBuy &&
    quote.amountSell === params.amountSell
  );
}
