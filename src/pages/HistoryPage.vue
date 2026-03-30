<template>
  <q-page class="app-page">
    <div class="app-screen app-screen--history">
      <div class="app-chip-row app-chip-row--history">
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

      <template v-if="filteredGroups.length">
        <section
          v-for="group in filteredGroups"
          :key="group.label"
          class="app-history-group"
        >
          <div class="app-group-label app-group-label--history">{{ group.label }}</div>

          <AppSurface class="app-history-list">
            <AppInfoRow
              v-for="item in group.items"
              :key="item.id"
              :icon="resolveHistoryIcon(item)"
              :title="resolveHistoryTitle(item)"
              :subtitle="resolveHistorySubtitle(item)"
              :badge="t(getStatusLabelKey(item.status))"
              :badge-tone="statusTone(item.status)"
              :value="formatTime(item.createdAt)"
            />
          </AppSurface>
        </section>
      </template>

      <AppSurface v-else class="app-history-empty">
        <div class="app-empty-state">{{ t('history.empty') }}</div>
      </AppSurface>

      <q-inner-loading :showing="ordersStore.loading" dark />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import AppInfoRow from '@components/ui/AppInfoRow.vue';
import AppSurface from '@components/ui/AppSurface.vue';
import { useOrdersStore } from '@stores/orders.store';
import type { MiniappOrderItem } from '@types/miniapp';
import { getStatusLabelKey, getStatusTone } from '@utils/miniapp';
import { formatAmount, formatMiniappTime } from '@utils/formatters';

const { locale, t } = useI18n();
const ordersStore = useOrdersStore();
const activeFilter = ref<'all' | 'active' | 'done'>('all');

const filters = computed(() => [
  { value: 'all', label: t('history.all') },
  { value: 'active', label: t('history.active') },
  { value: 'done', label: t('history.done') },
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
          return [1, 2, 3].includes(item.status);
        }

        return [4, 5].includes(item.status);
      }),
    }))
    .filter((group) => group.items.length > 0),
);

onMounted(async () => {
  if (!ordersStore.items.length) {
    await ordersStore.load();
  }
});

function formatTime(value: string) {
  return formatMiniappTime(value, locale.value);
}

function statusTone(status: number) {
  const tone = getStatusTone(status);
  if (tone === 'positive' || tone === 'negative' || tone === 'info') {
    return tone;
  }

  return 'warning';
}

function resolveHistoryIcon(item: MiniappOrderItem) {
  if (item.methodGet === 'cash') {
    return 'mdi-cash-fast';
  }

  return 'mdi-swap-horizontal';
}

function resolveHistoryTitle(item: MiniappOrderItem) {
  if (item.methodGet === 'cash') {
    return `Обмен ${item.currencySell} → ${item.currencyBuy}`;
  }

  return `Заявка ${item.currencySell} → ${item.currencyBuy}`;
}

function resolveHistorySubtitle(item: MiniappOrderItem) {
  return `${formatAmount(item.amountSell, locale.value)} ${item.currencySell} = ${formatAmount(item.amountBuy, locale.value)} ${item.currencyBuy}`;
}
</script>
