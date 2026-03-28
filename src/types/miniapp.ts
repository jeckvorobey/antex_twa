export interface MiniappUser {
  id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  language_code: string | null;
  is_bot: boolean;
  is_premium: boolean;
  role: number;
}

export interface MiniappProfileSummary {
  id: number;
  displayName: string;
  username: string | null;
  isPremium: boolean;
  languageCode: string;
}

export interface MiniappQuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  route?: string | null;
  tone: string;
}

export interface MiniappRateCard {
  id: string;
  label: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  rateText: string;
  amountSellExample: number;
  amountBuyExample: number;
  updatedAt: string;
}

export interface MiniappRatesSection {
  featured: MiniappRateCard[];
  chips: string[];
  updatedAt: string;
  allowance: number;
}

export interface MiniappServiceItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
}

export interface MiniappLocationItem {
  id: string;
  city: string;
  hours: string;
  accent: string;
}

export interface MiniappBanner {
  title: string;
  actionLabel: string;
}

export interface MiniappHomeResponse {
  profile: MiniappProfileSummary;
  quickActions: MiniappQuickAction[];
  rates: MiniappRatesSection;
  banner: MiniappBanner;
  services: MiniappServiceItem[];
  locations: MiniappLocationItem[];
}

export interface MiniappQuoteResponse {
  currencySell: string;
  currencyBuy: string;
  amountSell: number;
  amountBuy: number;
  rate: number;
  rateText: string;
  updatedAt: string;
  availableMethods: string[];
}

export interface MiniappCalculatorState {
  fromCurrency: string;
  toCurrency: string;
  amountSell: number;
}

export interface MiniappExchangeScreenResponse {
  calculator: MiniappCalculatorState;
  chips: string[];
  pairs: MiniappRateCard[];
  quote: MiniappQuoteResponse;
}

export interface MiniappBankSummary {
  id: number;
  code: string;
  name: string;
}

export interface MiniappOrderItem {
  id: number;
  currencySell: string;
  amountSell: number;
  currencyBuy: string;
  amountBuy: number;
  rate: number;
  status: number;
  methodGet: string | null;
  contactTelegram: string | null;
  createdAt: string;
  bank: MiniappBankSummary;
}

export interface MiniappOrdersResponse {
  items: MiniappOrderItem[];
}

export interface MiniappOrderCreate {
  currencySell: string;
  currencyBuy: string;
  amountSell: number;
  contactTelegram?: string | null;
  methodGet?: string | null;
}

export interface MiniappMenuItem {
  id: string;
  title: string;
  icon: string;
  action: 'route' | 'sheet' | 'link';
  route?: string | null;
  href?: string | null;
}

export interface MiniappProfileResponse {
  user: MiniappProfileSummary;
  menu: MiniappMenuItem[];
  version: string;
}

export interface GroupedOrders {
  label: string;
  items: MiniappOrderItem[];
}
