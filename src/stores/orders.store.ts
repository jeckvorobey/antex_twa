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

  const groups = computed(() => groupOrdersByDate(items.value));

  async function loadFirstPage() {
    if (loading.value) {
      return;
    }

    loading.value = true;
    try {
      const response = await fetchOrders({ limit: PAGE_LIMIT, offset: 0 });
      items.value = response.items;
      offset.value = response.items.length;
      total.value = response.total;
      hasMore.value = response.hasMore;
    } finally {
      loaded.value = true;
      loading.value = false;
    }
  }

  async function loadNextPage() {
    if (loading.value || loadingMore.value || !hasMore.value) {
      return;
    }

    loadingMore.value = true;
    try {
      const response = await fetchOrders({ limit: PAGE_LIMIT, offset: offset.value });
      const existingIds = new Set(items.value.map((item) => item.id));
      const nextItems = response.items.filter((item) => !existingIds.has(item.id));
      items.value = [...items.value, ...nextItems];
      offset.value += response.items.length;
      total.value = response.total;
      hasMore.value = response.hasMore;
    } finally {
      loadingMore.value = false;
    }
  }

  async function refresh() {
    if (loading.value || refreshing.value) {
      return;
    }

    refreshing.value = true;
    try {
      const response = await fetchOrders({ limit: PAGE_LIMIT, offset: 0 });
      items.value = response.items;
      offset.value = response.items.length;
      total.value = response.total;
      hasMore.value = response.hasMore;
    } finally {
      refreshing.value = false;
    }
  }

  function prepend(order: MiniappOrderItem) {
    const existed = items.value.some((item) => item.id === order.id);
    items.value = [order, ...items.value.filter((item) => item.id !== order.id)];
    offset.value = items.value.length;
    if (!existed) {
      total.value += 1;
    }
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
    loadNextPage,
    refresh,
    prepend,
  };
});
