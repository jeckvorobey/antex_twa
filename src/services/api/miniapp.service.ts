import { api } from '@boot/axios';
import type {
  AexReferralInfo,
  AexReferralsResponse,
  AexTransactionsResponse,
  AexWalletOut,
  MiniappCitiesResponse,
  MiniappExchangeScreenResponse,
  MiniappHomeResponse,
  MiniappManagerAvailability,
  MiniappOrderCreate,
  MiniappOrdersResponse,
  MiniappProfileResponse,
  MiniappQuoteResponse,
  MiniappReceiveMethod,
} from '@types/miniapp';

export async function fetchHome() {
  const response = await api.get<MiniappHomeResponse>('/api/miniapp/home');
  return response.data;
}

export async function fetchExchangeScreen() {
  const response = await api.get<MiniappExchangeScreenResponse>('/api/miniapp/exchange');
  return response.data;
}

/** Возвращает только актуальный режим работы менеджеров для pre-submit проверки. */
export async function fetchManagerAvailability() {
  const response = await api.get<MiniappManagerAvailability>('/api/miniapp/manager-availability');
  return response.data;
}

/** Рассчитывает актуальную котировку выбранной пары перед созданием заявки. */
export async function fetchQuote(
  params: {
    currencySell: string;
    currencyBuy: string;
    amountSell: number;
    methodGet?: MiniappReceiveMethod;
  },
  config: { signal?: AbortSignal } = {},
) {
  const response = await api.get<MiniappQuoteResponse>('/api/miniapp/exchange/quote', {
    params,
    ...config,
  });
  return response.data;
}

export async function fetchCities() {
  const response = await api.get<MiniappCitiesResponse>('/api/miniapp/cities');
  return response.data;
}

export async function fetchOrders(
  params: { limit?: number; offset?: number } = {},
  config: { signal?: AbortSignal } = {},
) {
  const response = await api.get<MiniappOrdersResponse>('/api/miniapp/orders', {
    params,
    ...config,
  });
  return response.data;
}

export async function createOrder(payload: MiniappOrderCreate) {
  await api.post('/api/miniapp/orders', payload);
}

export async function fetchProfile() {
  const response = await api.get<MiniappProfileResponse>('/api/miniapp/profile');
  return response.data;
}

// ── ATXG referral & transactions ────────────────────────────────────

export async function fetchAexReferralInfo() {
  const response = await api.get<AexReferralInfo>('/api/miniapp/aex/referral');
  return response.data;
}

export async function fetchAexTransactions(params: { limit?: number; offset?: number } = {}) {
  const response = await api.get<AexTransactionsResponse>('/api/miniapp/aex/transactions', {
    params,
  });
  return response.data;
}

export async function fetchAexReferrals(params: { limit?: number; offset?: number } = {}) {
  const response = await api.get<AexReferralsResponse>('/api/miniapp/aex/referrals', {
    params,
  });
  return response.data;
}

export async function applyReferralCode(code: string) {
  const response = await api.post<{ success: boolean }>('/api/miniapp/aex/referral/apply', {
    code,
  });
  return response.data;
}

export async function transferAex(payload: { orderId: number; amount: number }) {
  const response = await api.post<{ success: boolean }>('/api/miniapp/aex/transfer', payload);
  return response.data;
}

export async function fetchAexWallet() {
  const response = await api.get<AexWalletOut>('/api/aex/wallet');
  return response.data;
}
