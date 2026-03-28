<template>
  <q-page class="app-page q-pt-md">
    <div class="app-page__content">
      <div class="row q-col-gutter-sm">
        <div
          v-for="filter in filters"
          :key="filter.value"
          class="col-auto"
        >
          <q-chip
            clickable
            :class="['app-chip', activeFilter === filter.value ? 'app-chip--active' : null]"
            @click="activeFilter = filter.value"
          >
            {{ filter.label }}
          </q-chip>
        </div>
      </div>

      <template v-if="filteredGroups.length">
        <section v-for="group in filteredGroups" :key="group.label" class="column q-gutter-sm">
          <div class="app-muted text-caption">{{ group.label }}</div>

          <AppSurface padded>
            <div class="column">
              <div
                v-for="item in group.items"
                :key="item.id"
                class="row items-center justify-between q-py-sm"
                style="border-bottom: 1px solid rgba(212, 175, 55, 0.08);"
              >
                <div class="row items-center q-gutter-sm">
                  <div
                    class="row items-center justify-center"
                    style="width: 36px; height: 36px; border-radius: 10px; background: rgba(212, 175, 55, 0.08);"
                  >
                    <q-icon name="currency_exchange" color="primary" size="18px" />
                  </div>
                  <div>
                    <div class="text-body2 text-weight-medium">
                      {{ item.currencySell }} -> {{ item.currencyBuy }}
                    </div>
                    <div class="app-secondary-text text-caption">
                      {{ item.amountSell }} {{ item.currencySell }} = {{ item.amountBuy }} {{ item.currencyBuy }}
                    </div>
                  </div>
                </div>

                <div class="column items-end">
                  <q-badge :color="getStatusTone(item.status)" rounded class="q-mb-xs">
                    {{ t(getStatusLabelKey(item.status)) }}
                  </q-badge>
                  <span class="app-muted text-caption">{{ formatTime(item.createdAt) }}</span>
                </div>
              </div>
            </div>
          </AppSurface>
        </section>
      </template>

      <AppSurface v-else padded>
        <div class="app-secondary-text text-center">{{ t('history.empty') }}</div>
      </AppSurface>

      <q-inner-loading :showing="ordersStore.loading" dark />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import AppSurface from '@components/ui/AppSurface.vue';
import { useOrdersStore } from '@stores/orders.store';
import { getStatusLabelKey, getStatusTone } from '@utils/miniapp';
import { formatMiniappTime } from '@utils/formatters';

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
</script>
