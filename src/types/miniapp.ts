export type MiniappUserRole = 2 | 9;

export interface MiniappUser {
  id: number;
  username: string | null;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
  language_code: string | null;
  photo_url: string | null;
  is_bot: boolean;
  is_premium: boolean;
  role: MiniappUserRole;
  trusted_contact: string | null;
  trusted_contact_source: string | null;
  trusted_contact_ready: boolean;
}

export interface MiniappCity {
  id: number;
  name: string;
  country: string;
  countryRuName: string;
  countryCode: string;
  countryFlag: string;
  createdAt: string;
  updatedAt: string;
}

export interface MiniappProfileSummary {
  id: number;
  displayName: string;
  username: string | null;
  photoUrl: string | null;
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
  country: string;
  countryLabel: string;
  countryFlag?: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  calculationRate: number;
  rateDisplay: string;
  rateText: string;
  amountSellExample: number;
  amountBuyExample: number;
  updatedAt: string;
  availableMethods: string[];
}

export interface MiniappCountryFilterItem {
  id: string;
  label: string;
  currency: string;
  code: string;
  flag: string;
}

export interface MiniappRatesSection {
  featured: MiniappRateCard[];
  chips: string[];
  previewLimit: number;
  updatedAt: string | null;
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
  country: string;
  countryLabel: string;
  countryFlag: string;
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
  countries: MiniappCountryFilterItem[];
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
  rateDisplay: string;
  rateText: string;
  updatedAt: string;
  availableMethods: string[];
}

export interface MiniappCalculatorState {
  fromCurrency: string;
  toCurrency: string;
  amountSell: number;
}

export interface MiniappManagerAvailability {
  status: 'working' | 'offline' | 'unknown';
  scheduleEnabled: boolean;
  workingDaysUtc: number[];
  startTimeUtc: string;
  endTimeUtc: string;
  currentStartAt: string | null;
  currentEndAt: string | null;
  nextStartAt: string | null;
  businessHoursText: string;
}

export interface MiniappAexPayoutOption {
  currencyBuy: 'USDT' | 'RUB';
  rate: number;
  rateDisplay: string;
  rateText: string;
  availableMethods: string[];
}

export interface MiniappExchangeScreenResponse {
  calculator: MiniappCalculatorState;
  chips: string[];
  pairs: MiniappRateCard[];
  quote: MiniappQuoteResponse;
  aexPayoutOptions: MiniappAexPayoutOption[];
  managerAvailability: MiniappManagerAvailability;
}

export interface MiniappBankSummary {
  id: number;
  code: string;
  name: string;
}

export interface MiniappOrderItem {
  id: number;
  publicNumber: string;
  cityId: number | null;
  country: string;
  currencySell: string;
  amountSell: number;
  currencyBuy: string;
  amountBuy: number | null;
  rate: number | null;
  status: number;
  methodGet: string;
  contactTelegram: string | null;
  createdAt: string;
  updatedAt: string;
  city: MiniappCity | null;
  managerAvailability?: MiniappManagerAvailability | null;
}

export interface MiniappOrdersResponse {
  items: MiniappOrderItem[];
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}

export type MiniappReceiveMethod = 'qrcode' | 'cash' | 'bank_account' | 'pay_services';

export interface MiniappOrderCreate {
  country: string;
  cityId?: number | null;
  currencySell: string;
  currencyBuy: string;
  amountSell: number;
  amountBuy: number;
  rate: number;
  methodGet: MiniappReceiveMethod;
}

export interface MiniappCitiesResponse {
  items: MiniappCity[];
}

export interface TrustedContactState {
  ready: boolean;
  contact: string | null;
  source: 'username' | 'phone' | null;
  phone: string | null;
  username: string | null;
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
  aex?: AexProfileSection;
  managerAvailability: MiniappManagerAvailability;
}

export interface GroupedOrders {
  label: string;
  items: MiniappOrderItem[];
}

// ── ATXG referral & balance ─────────────────────────────────────────

export interface AexBalance {
  available: number;
  reserved: number;
  totalEarned: number;
  totalWithdrawn: number;
}

export interface AexReferralProgramConfig {
  referralPercent: string;
  referralMinWithdraw: string;
  referralMaxWithdraw: string | null;
  aexRate: string;
  aexWithdrawLimit: string;
}

export interface AexReferralInfo {
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  programConfig: AexReferralProgramConfig;
}

export interface AexTransactionItem {
  id: number;
  type:
    | 'referral_reward'
    | 'withdrawal'
    | 'bonus'
    | 'adjustment'
    | 'reserved'
    | 'debited'
    | 'refund';
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

export interface AexTransactionsResponse {
  items: AexTransactionItem[];
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}

export interface AexReferralUserItem {
  id: number;
  displayName: string;
  username: string | null;
  photoUrl: string | null;
  joinedAt: string;
  rewardPercent: string;
}

export interface AexReferralsResponse {
  items: AexReferralUserItem[];
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
  totalAccrued: string;
  rewardPercent: string;
}

export interface AexProfileSection {
  balance: AexBalance;
  referralCode: string;
}

export interface AexWalletOut {
  id: number;
  user_id: number;
  balance_available: string;
  balance_reserved: string;
  balance_total: string;
  is_exchange_available: boolean;
  createdAt: string;
  updatedAt: string;
}
