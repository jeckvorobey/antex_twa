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
          @load="loadMore"
        >
          <template v-if="filteredGroups.length">
            <section
              v-for="group in filteredGroups"
              :key="group.label"
              class="app-history-group q-mb-md"
            >
              <div class="app-group-label app-group-label--history q-mb-sm">{{ group.label }}</div>

              <AppSurface class="app-history-list">
                <div
                  v-for="item in group.items"
                  :key="item.id"
                  class="app-history-item"
                >
                  <div class="column">
                    <div class="row justify-center no-wrap">
                      <div class="col-12 app-history-item__amount text-center ellipsis">
                        {{ resolveAmountLine(item) }}
                      </div>
                    </div>

                    <div class="row items-center no-wrap q-mt-xs">
                      <div class="col-4 row justify-start">
                        <q-btn
                          flat
                          dense
                          no-caps
                          color="warning"
                          icon="autorenew"
                          :label="t('history.repeat')"
                          size="sm"
                          class="app-history-item__repeat-btn"
                          @click="repeatOrder(item)"
                        />
                      </div>

                      <div class="col-4 row justify-center">
                        <q-chip
                          dense
                          square
                          :color="statusColor(item.status)"
                          text-color="white"
                          class="q-ma-none"
                        >
                          {{ t(getStatusLabelKey(item.status)) }}
                        </q-chip>
                      </div>

                      <div class="col-4 app-history-item__time text-right">{{ formatTime(item.createdAt) }}</div>
                    </div>
                  </div>
                </div>
              </AppSurface>
            </section>
          </template>

          <AppSurface v-else-if="!ordersStore.loading" class="app-history-empty">
            <div class="app-empty-state">{{ t('history.empty') }}</div>
          </AppSurface>

          <template #loading>
            <div class="row justify-center q-my-md">
              <q-spinner-dots color="warning" size="32px" />
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

import AppSurface from '@components/ui/AppSurface.vue';
import { useOrdersStore } from '@stores/orders.store';
import { useUiStore } from '@stores/ui.store';
import type { MiniappOrderItem } from '@types/miniapp';
import { formatAmount, formatMiniappTime } from '@utils/formatters';
import { getStatusLabelKey, getStatusTone } from '@utils/miniapp';

const { locale, t } = useI18n();
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
  if (!ordersStore.items.length) {
    await ordersStore.loadFirstPage();
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

function formatTime(value: string) {
  return formatMiniappTime(value, locale.value);
}

function statusColor(status: number) {
  const tone = getStatusTone(status);
  if (tone === 'positive') {
    return 'positive';
  }

  if (tone === 'negative') {
    return 'negative';
  }

  if (tone === 'info') {
    return 'info';
  }

  return 'warning';
}

function resolveAmountLine(item: MiniappOrderItem) {
  const amountBuy = item.amountBuy ?? 0;
  return `${currencyFlag(item.currencySell)} ${formatAmount(item.amountSell, locale.value)} ${item.currencySell} → ${currencyFlag(item.currencyBuy)} ${formatAmount(amountBuy, locale.value)} ${item.currencyBuy}`;
}

function currencyFlag(currency: string) {
  const flags: Record<string, string> = {
    RUB: '🇷🇺',
    USDT: '₮',
    THB: '🇹🇭',
    GEL: '🇬🇪',
    VND: '🇻🇳',
  };

  return flags[currency] ?? currency;
}
</script>
