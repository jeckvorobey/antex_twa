import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { fetchOrders } from '@services/api/miniapp.service';
import type { MiniappOrderItem } from '@types/miniapp';
import { groupOrdersByDate } from '@utils/miniapp';

const PAGE_LIMIT = 10;

export const useOrdersStore = defineStore('orders', () => {
  const items = ref<MiniappOrderItem[]>([]);
  const loading = ref(false);
  const loaded = ref(false);
  const loadingMore = ref(false);
  const refreshing = ref(false);
  const hasMore = ref(true);
  const offset = ref(0);
  const total = ref(0);
  let listRequest: Promise<void> | null = null;
  let latestRequestId = 0;

  const groups = computed(() => groupOrdersByDate(items.value));

  async function loadFirstPage() {
    await requestFirstPage('loading');
  }

  /** Запускает запрос первой страницы; устаревший ответ не меняет состояние списка. */
  async function requestFirstPage(state: 'loading' | 'refreshing') {
    const requestId = ++latestRequestId;
    const request = (async () => {
      loading.value = state === 'loading';
      refreshing.value = state === 'refreshing';
      try {
        const response = await fetchOrders({ limit: PAGE_LIMIT, offset: 0 });
        if (requestId !== latestRequestId) {
          return;
        }
        items.value = response.items;
        offset.value = response.items.length;
        total.value = response.total;
        hasMore.value = response.hasMore;
      } finally {
        if (requestId === latestRequestId && state === 'loading') {
          loaded.value = true;
          loading.value = false;
        }
        if (requestId === latestRequestId && state === 'refreshing') {
          refreshing.value = false;
        }
      }
    })();
    listRequest = request;
    try {
      await request;
    } finally {
      if (listRequest === request) {
        listRequest = null;
      }
    }
  }

  /** Немедленно загружает актуальную первую страницу и вытесняет устаревший запрос списка. */
  async function reloadFirstPage() {
    await requestFirstPage('loading');
  }

  async function loadNextPage() {
    if (listRequest || !hasMore.value) {
      return;
    }

    const requestId = ++latestRequestId;
    const request = (async () => {
      loadingMore.value = true;
      try {
        const response = await fetchOrders({ limit: PAGE_LIMIT, offset: offset.value });
        if (requestId !== latestRequestId) {
          return;
        }
        const existingIds = new Set(items.value.map((item) => item.id));
        const nextItems = response.items.filter((item) => !existingIds.has(item.id));
        items.value = [...items.value, ...nextItems];
        offset.value += response.items.length;
        total.value = response.total;
        hasMore.value = response.hasMore;
      } finally {
        loadingMore.value = false;
      }
    })();
    listRequest = request;
    try {
      await request;
    } finally {
      if (listRequest === request) {
        listRequest = null;
      }
    }
  }

  async function refresh() {
    await requestFirstPage('refreshing');
  }

  function prepend(order: MiniappOrderItem) {
    const existingIndex = items.value.findIndex((item) => item.id === order.id);
    if (existingIndex === -1) {
      items.value = [order, ...items.value];
      total.value += 1;
    } else {
      const nextItems = items.value.slice();
      nextItems.splice(existingIndex, 1);
      items.value = [order, ...nextItems];
    }
    offset.value = items.value.length;
  }

  return {
    items,
    loading,
    loaded,
    loadingMore,
    refreshing,
    hasMore,
    offset,
    total,
    groups,
    loadFirstPage,
    reloadFirstPage,
    loadNextPage,
    refresh,
    prepend,
  };
});
