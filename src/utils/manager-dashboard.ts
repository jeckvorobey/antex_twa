import type { ManagerOrderSummary } from '@types/manager-chat';

export function formatManagerDashboardDate(
  date: Date,
  locale: string,
  todayLabel: string,
): string {
  const parts = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${todayLabel}. ${values.day} ${values.month} ${values.year}`;
}

export function countTodayOrders(orders: ManagerOrderSummary[], now: Date): number {
  return orders.filter((order) => {
    const createdAt = new Date(order.createdAt);
    return (
      createdAt.getFullYear() === now.getFullYear() &&
      createdAt.getMonth() === now.getMonth() &&
      createdAt.getDate() === now.getDate()
    );
  }).length;
}

export function millisecondsUntilNextLocalDay(now: Date): number {
  const nextDay = new Date(now);
  nextDay.setHours(24, 0, 0, 0);
  return nextDay.getTime() - now.getTime();
}

export function formatActiveOrderTotals(
  orders: ManagerOrderSummary[],
  locale: string,
): string {
  const totals = new Map<string, number>();
  for (const order of orders) {
    totals.set(order.currencySell, (totals.get(order.currencySell) ?? 0) + order.amountSell);
  }
  const formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  return Array.from(totals, ([currency, amount]) => `${formatter.format(amount)} ${currency}`).join(
    ' · ',
  );
}
