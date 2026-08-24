import type { AntexBadgeTone } from '@components/ui/AntexBadge.vue';

export type OrderCardMode = 'user' | 'manager';

export interface OrderCardViewModel {
  id: number;
  publicNumber: string;
  statusLabelKey: string;
  statusTone: AntexBadgeTone;
  currencySell: string;
  amountSell: number;
  currencyBuy: string;
  amountBuy: number | null;
  rateText: string | null;
  location: string;
  method: string | null;
  createdAt: string;
  customerName: string | null;
}

export type TranslateFn = (key: string, named?: Record<string, unknown>) => string;
export type HasTranslationFn = (key: string) => boolean;
