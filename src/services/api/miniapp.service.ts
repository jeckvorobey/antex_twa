import { api } from '@boot/axios';
import type {
  MiniappCitiesResponse,
  MiniappExchangeScreenResponse,
  MiniappHomeResponse,
  MiniappOrderCreate,
  MiniappOrderItem,
  MiniappOrdersResponse,
  MiniappProfileResponse,
} from '@types/miniapp';

export async function fetchHome() {
  const response = await api.get<MiniappHomeResponse>('/api/miniapp/home');
  return response.data;
}

export async function fetchExchangeScreen() {
  const response = await api.get<MiniappExchangeScreenResponse>('/api/miniapp/exchange');
  return response.data;
}

export async function fetchCities() {
  const response = await api.get<MiniappCitiesResponse>('/api/miniapp/cities');
  return response.data;
}

export async function fetchOrders(params: { limit?: number; offset?: number } = {}) {
  const response = await api.get<MiniappOrdersResponse>('/api/miniapp/orders', { params });
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
