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

  const groups = computed(() => groupOrdersByDate(items.value));

  async function loadFirstPage() {
    if (listRequest) {
      return listRequest;
    }

    const request = (async () => {
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

  /** Загружает актуальную первую страницу после завершения текущего запроса списка. */
  async function reloadFirstPage() {
    while (listRequest) {
      try {
        await listRequest;
      } catch {
        // Ошибка предыдущей загрузки не должна отменять принудительное обновление.
      }
    }
    await loadFirstPage();
  }

  async function loadNextPage() {
    if (listRequest || !hasMore.value) {
      return;
    }

    const request = (async () => {
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
    if (listRequest) {
      await reloadFirstPage();
      return;
    }

    const request = (async () => {
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
