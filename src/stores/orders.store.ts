import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { fetchOrders } from '@services/api/miniapp.service';
import type { MiniappOrderItem } from '@types/miniapp';
import { groupOrdersByDate } from '@utils/miniapp';

export const useOrdersStore = defineStore('orders', () => {
  const items = ref<MiniappOrderItem[]>([]);
  const loading = ref(false);

  const groups = computed(() => groupOrdersByDate(items.value));

  async function load() {
    loading.value = true;
    try {
      const response = await fetchOrders();
      items.value = response.items;
    } finally {
      loading.value = false;
    }
  }

  function prepend(order: MiniappOrderItem) {
    items.value = [order, ...items.value];
  }

  return { items, loading, groups, load, prepend };
});
