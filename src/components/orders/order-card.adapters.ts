import type {
  HasTranslationFn,
  OrderCardViewModel,
  TranslateFn,
} from '@components/orders/order-card.model';
import type { ManagerOrderSummary } from '@types/manager-chat';
import type { MiniappOrderItem } from '@types/miniapp';
import { formatMiniappTime } from '@utils/formatters';
import { managerUserFullName } from '@utils/manager-chat';
import { getStatusLabelKey, getStatusTone } from '@utils/miniapp';

type OrderCardSource = Pick<
  MiniappOrderItem,
  | 'id'
  | 'publicNumber'
  | 'currencySell'
  | 'amountSell'
  | 'currencyBuy'
  | 'amountBuy'
  | 'rateText'
  | 'country'
  | 'city'
  | 'status'
  | 'methodGet'
  | 'createdAt'
>;

function translatedValue(
  key: string,
  fallback: string,
  t: TranslateFn,
  te: HasTranslationFn,
): string {
  return te(key) ? t(key) : fallback;
}

function baseOrderCard(
  order: OrderCardSource,
  locale: string,
  t: TranslateFn,
  te: HasTranslationFn,
): OrderCardViewModel {
  const country = translatedValue(
    `manager.countries.${order.country}`,
    order.city?.countryRuName || order.country,
    t,
    te,
  );
  return {
    id: order.id,
    publicNumber: order.publicNumber,
    statusLabelKey: getStatusLabelKey(order.status),
    statusTone: getStatusTone(order.status) as OrderCardViewModel['statusTone'],
    currencySell: order.currencySell,
    amountSell: order.amountSell,
    currencyBuy: order.currencyBuy,
    amountBuy: order.amountBuy,
    rateText: order.rateText,
    location: order.city ? `${country}, ${order.city.name}` : country,
    method: translatedValue(
      `manager.receiveMethods.${order.methodGet}`,
      order.methodGet,
      t,
      te,
    ),
    createdAt: formatMiniappTime(order.createdAt, locale),
    customerName: null,
  };
}

export function toUserOrderCard(
  order: MiniappOrderItem,
  locale: string,
  t: TranslateFn,
  te: HasTranslationFn,
): OrderCardViewModel {
  return baseOrderCard(order, locale, t, te);
}

export function toManagerOrderCard(
  order: ManagerOrderSummary,
  locale: string,
  t: TranslateFn,
  te: HasTranslationFn,
): OrderCardViewModel {
  const view = baseOrderCard(order, locale, t, te);
  const customerName = order.user
    ? managerUserFullName(order.user) || t('manager.customerFallback', { id: order.user.id })
    : null;
  return { ...view, customerName };
}
