import type {
  GroupedOrders,
  MiniappOrderItem,
  MiniappQuoteResponse,
} from '@types/miniapp';

type QuoteParams = {
  currencySell: string;
  currencyBuy: string;
  amountSell: number | null;
};

const STATUS_LABELS: Record<number, string> = {
  1: 'status.new',
  2: 'status.confirmed',
  3: 'status.processing',
  4: 'status.completed',
  5: 'status.cancelled',
};

const STATUS_TONES: Record<number, string> = {
  1: 'warning',
  2: 'info',
  3: 'warning',
  4: 'positive',
  5: 'negative',
};

export function getStatusLabelKey(status: number) {
  return STATUS_LABELS[status] ?? 'status.new';
}

export function getStatusTone(status: number) {
  return STATUS_TONES[status] ?? 'warning';
}

export function groupOrdersByDate(items: MiniappOrderItem[]) {
  const formatter = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const groups = new Map<string, MiniappOrderItem[]>();

  items.forEach((item) => {
    const label = formatter.format(new Date(item.createdAt));
    groups.set(label, [...(groups.get(label) ?? []), item]);
  });

  return Array.from(groups.entries()).map<GroupedOrders>(([label, groupedItems]) => ({
    label,
    items: groupedItems,
  }));
}

export function isQuoteCurrent(quote: MiniappQuoteResponse | null, params: QuoteParams) {
  if (!quote || !params.amountSell || params.amountSell <= 0) {
    return false;
  }

  return (
    quote.currencySell === params.currencySell
    && quote.currencyBuy === params.currencyBuy
    && quote.amountSell === params.amountSell
  );
}
