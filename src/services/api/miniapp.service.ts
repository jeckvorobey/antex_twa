import { api } from '@boot/axios';
import type {
  MiniappExchangeScreenResponse,
  MiniappHomeResponse,
  MiniappOrderCreate,
  MiniappOrderItem,
  MiniappOrdersResponse,
  MiniappProfileResponse,
  MiniappQuoteResponse,
} from '@types/miniapp';

export async function fetchHome() {
  const response = await api.get<MiniappHomeResponse>('/api/miniapp/home');
  return response.data;
}

export async function fetchExchangeScreen() {
  const response = await api.get<MiniappExchangeScreenResponse>('/api/miniapp/exchange');
  return response.data;
}

export async function fetchQuote(params: { currencySell: string; currencyBuy: string; amountSell: number }) {
  const response = await api.get<MiniappQuoteResponse>('/api/miniapp/exchange/quote', { params });
  return response.data;
}

export async function fetchOrders() {
  const response = await api.get<MiniappOrdersResponse>('/api/miniapp/orders');
  return response.data;
}

export async function createOrder(payload: MiniappOrderCreate) {
  const response = await api.post<MiniappOrderItem>('/api/miniapp/orders', payload);
  return response.data;
}

export async function fetchProfile() {
  const response = await api.get<MiniappProfileResponse>('/api/miniapp/profile');
  return response.data;
}
