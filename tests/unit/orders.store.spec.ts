import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useOrdersStore } from '@stores/orders.store';
import type { MiniappOrderItem, MiniappOrdersResponse } from '@types/miniapp';

vi.mock('@services/api/miniapp.service', () => ({
  fetchOrders: vi.fn(),
}));

import { fetchOrders } from '@services/api/miniapp.service';

function makeOrder(id: number): MiniappOrderItem {
  return {
    id,
    publicNumber: `202605${String(id).padStart(4, '0')}`,
    cityId: null,
    country: 'thailand',
    currencySell: 'RUB',
    amountSell: 5000 + id,
    currencyBuy: 'THB',
    amountBuy: 2000 + id,
    rate: 0.4,
    status: 1,
    methodGet: 'qrcode',
    contactTelegram: 'customer',
    createdAt: '2026-05-22T12:00:00+00:00',
    updatedAt: '2026-05-22T12:00:00+00:00',
    city: null,
  };
}

function makeResponse(ids: number[], params: Partial<MiniappOrdersResponse> = {}): MiniappOrdersResponse {
  return {
    items: ids.map(makeOrder),
    limit: params.limit ?? 20,
    offset: params.offset ?? 0,
    total: params.total ?? ids.length,
    hasMore: params.hasMore ?? false,
  };
}

describe('orders store pagination', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('refresh replaces the list with the first page', async () => {
    const store = useOrdersStore();
    store.prepend(makeOrder(99));
    vi.mocked(fetchOrders).mockResolvedValue(makeResponse([1, 2], { total: 2, hasMore: false }));

    await store.refresh();

    expect(fetchOrders).toHaveBeenCalledWith({ limit: 20, offset: 0 });
    expect(store.items.map((item) => item.id)).toEqual([1, 2]);
    expect(store.offset).toBe(2);
    expect(store.hasMore).toBe(false);
  });

  it('loadNextPage appends following pages and stops when hasMore is false', async () => {
    const store = useOrdersStore();
    vi.mocked(fetchOrders)
      .mockResolvedValueOnce(makeResponse([1, 2], { total: 3, hasMore: true }))
      .mockResolvedValueOnce(makeResponse([3], { offset: 2, total: 3, hasMore: false }));

    await store.loadFirstPage();
    await store.loadNextPage();
    await store.loadNextPage();

    expect(fetchOrders).toHaveBeenCalledTimes(2);
    expect(fetchOrders).toHaveBeenNthCalledWith(2, { limit: 20, offset: 2 });
    expect(store.items.map((item) => item.id)).toEqual([1, 2, 3]);
    expect(store.hasMore).toBe(false);
  });
});
