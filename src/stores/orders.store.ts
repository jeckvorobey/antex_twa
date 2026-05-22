import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { fetchOrders } from '@services/api/miniapp.service';
import type { MiniappOrderItem } from '@types/miniapp';
import { groupOrdersByDate } from '@utils/miniapp';

const PAGE_LIMIT = 20;

export const useOrdersStore = defineStore('orders', () => {
  const items = ref<MiniappOrderItem[]>([]);
  const loading = ref(false);
  const loadingMore = ref(false);
  const refreshing = ref(false);
  const hasMore = ref(true);
  const offset = ref(0);
  const total = ref(0);

  const groups = computed(() => groupOrdersByDate(items.value));

  async function loadFirstPage() {
    loading.value = true;
    try {
      const response = await fetchOrders({ limit: PAGE_LIMIT, offset: 0 });
      items.value = response.items;
      offset.value = response.items.length;
      total.value = response.total;
      hasMore.value = response.hasMore;
    } finally {
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
      items.value = [...items.value, ...response.items];
      offset.value += response.items.length;
      total.value = response.total;
      hasMore.value = response.hasMore;
    } finally {
      loadingMore.value = false;
    }
  }

  async function refresh() {
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
    items.value = [order, ...items.value];
    offset.value += 1;
    total.value += 1;
  }

  return {
    items,
    loading,
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
