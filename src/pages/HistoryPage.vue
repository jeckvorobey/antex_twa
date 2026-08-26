<template>
  <q-page class="app-page app-page--history column no-wrap">
    <div class="app-screen app-screen--history column no-wrap full-height q-pt-md">
      <div class="row items-center no-wrap q-gutter-x-sm">
        <div class="app-chip-row app-chip-row--history col row no-wrap">
          <q-chip
            v-for="filter in filters"
            :key="filter.value"
            clickable
            :class="['app-chip', activeFilter === filter.value ? 'app-chip--active' : null]"
            @click="activeFilter = filter.value"
          >
            {{ filter.label }}
          </q-chip>
        </div>

        <q-btn
          round
          flat
          dense
          icon="refresh"
          color="warning"
          :aria-label="t('history.refresh')"
          :loading="ordersStore.refreshing"
          @click="refresh"
        >
          <q-tooltip>{{ t('history.refresh') }}</q-tooltip>
        </q-btn>
      </div>

      <div ref="historyScrollRef" class="col q-pt-sm app-history-scroll">
        <q-infinite-scroll
          ref="infiniteScrollRef"
          :scroll-target="historyScrollRef"
          :offset="120"
          :disable="!ordersStore.hasMore || ordersStore.loading || ordersStore.refreshing"
          :aria-busy="ordersStore.loading || ordersStore.refreshing"
          @load="loadMore"
        >
          <div
            v-if="ordersStore.loading && !ordersStore.items.length"
            class="column q-gutter-y-sm q-my-md items-center"
          >
            <AntexSkeleton preset="order-card" />
            <AntexSkeleton preset="order-card" />
          </div>

          <OrderHistoryList
            v-else-if="filteredGroups.length"
            :groups="filteredGroups"
            @repeat="repeatOrder"
          />

          <AntexEmptyState
            v-else-if="!ordersStore.loading"
            :title="t('history.empty')"
            class="app-history-empty"
          />

          <template #loading>
            <div class="column q-gutter-y-sm q-my-md items-center">
              <AntexSkeleton preset="order-card" />
              <AntexSkeleton preset="order-card" />
            </div>
          </template>
        </q-infinite-scroll>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import OrderHistoryList from '@components/orders/OrderHistoryList.vue';
import AntexEmptyState from '@components/ui/AntexEmptyState.vue';
import AntexSkeleton from '@components/ui/AntexSkeleton.vue';
import { useOrdersStore } from '@stores/orders.store';
import { useUiStore } from '@stores/ui.store';
import type { MiniappOrderItem } from '@types/miniapp';

const { t } = useI18n();
const ordersStore = useOrdersStore();
const uiStore = useUiStore();
const activeFilter = ref<'all' | 'active' | 'done' | 'cancelled'>('all');
const infiniteScrollRef = ref<{ resume: () => void; stop: () => void } | null>(null);
const historyScrollRef = ref<HTMLElement | null>(null);

const filters = computed(() => [
  { value: 'all', label: t('history.all') },
  { value: 'active', label: t('history.active') },
  { value: 'done', label: t('history.done') },
  { value: 'cancelled', label: t('history.cancelled') },
]);

const filteredGroups = computed(() =>
  ordersStore.groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (activeFilter.value === 'all') {
          return true;
        }

        if (activeFilter.value === 'active') {
          return [1, 2].includes(item.status);
        }

        if (activeFilter.value === 'done') {
          return item.status === 3;
        }

        return item.status === 4;
      }),
    }))
    .filter((group) => group.items.length > 0),
);

onMounted(async () => {
  if (!ordersStore.loaded || !ordersStore.items.length) {
    await ordersStore.loadFirstPage();
  } else {
    void ordersStore.refresh();
  }
});

async function refresh() {
  await ordersStore.refresh();
  infiniteScrollRef.value?.resume();
}

async function loadMore(_: number, done: (stop?: boolean) => void) {
  await ordersStore.loadNextPage();
  done(!ordersStore.hasMore);
}

function repeatOrder(item: MiniappOrderItem) {
  uiStore.openOrderSheet({
    currencySell: item.currencySell,
    currencyBuy: item.currencyBuy,
    amountSell: item.amountSell,
    country: item.country,
    cityId: item.cityId,
  });
}
</script>
