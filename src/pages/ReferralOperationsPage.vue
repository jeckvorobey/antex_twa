<template>
  <q-page class="app-page app-page--history column no-wrap">
    <div class="app-screen app-screen--history column no-wrap full-height q-pt-md">
      <div class="row items-center q-mb-sm">
        <div class="app-section-label col">{{ t('referral.history') }}</div>
        <q-btn
          round
          flat
          dense
          icon="refresh"
          color="warning"
          size="sm"
          :aria-label="t('referral.refresh')"
          :loading="aexStore.txRefreshing"
          @click="refresh"
        >
          <q-tooltip>{{ t('referral.refresh') }}</q-tooltip>
        </q-btn>
      </div>

      <div ref="scrollRef" class="col app-referral-tx-scroll">
        <AppSurface v-if="transactions.length" class="app-referral-tx-list">
          <div v-for="tx in transactions" :key="tx.id" class="app-referral-tx-item">
            <div class="app-referral-tx-item__info">
              <div class="app-referral-tx-item__desc">
                <q-icon
                  :name="txTypeIcon(tx.type)"
                  :color="txTypeColor(tx.type)"
                  size="16px"
                  class="q-mr-xs"
                />
                {{ txTypeLabel(tx.type) }}
              </div>
              <div v-if="tx.description" class="app-referral-tx-item__detail">
                {{ tx.description }}
              </div>
              <div class="app-referral-tx-item__date">{{ formatDate(tx.createdAt) }}</div>
            </div>
            <div
              :class="[
                'app-referral-tx-item__amount',
                tx.amount >= 0 ? 'text-positive' : 'text-negative',
              ]"
            >
              {{ tx.amount >= 0 ? '+' : '' }}{{ formatTokenAmount(tx.amount) }}
            </div>
          </div>
        </AppSurface>

        <AppSurface
          v-else-if="!aexStore.txLoading && aexStore.txLoaded"
          class="app-referral-tx-empty q-pa-md"
        >
          <div class="app-empty-state">{{ t('referral.noTransactions') }}</div>
        </AppSurface>

        <q-infinite-scroll
          v-if="aexStore.txHasMore"
          ref="infiniteScrollRef"
          :scroll-target="scrollRef"
          :offset="120"
          :disable="aexStore.txLoading || aexStore.txRefreshing"
          @load="loadMore"
        >
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
import { useAexStore } from '@stores/aex.store';
import { formatMiniappDateTime } from '@utils/formatters';

const { locale, t } = useI18n();
const aexStore = useAexStore();
const infiniteScrollRef = ref<{ resume: () => void; stop: () => void } | null>(null);
const scrollRef = ref<HTMLElement | null>(null);

const transactions = computed(() => aexStore.transactions ?? []);

onMounted(async () => {
  if (!aexStore.txLoaded || !transactions.value.length) {
    await aexStore.loadFirstPage();
  } else {
    void aexStore.refreshTransactions();
  }
});

async function refresh() {
  await aexStore.refreshTransactions();
  infiniteScrollRef.value?.resume();
}

async function loadMore(_: number, done: (stop?: boolean) => void) {
  await aexStore.loadNextPage();
  done(!aexStore.txHasMore);
}

function formatDate(value: string) {
  return formatMiniappDateTime(value, locale.value);
}

function formatTokenAmount(value: number): string {
  if (Number.isInteger(value)) {
    return value.toLocaleString(locale.value);
  }
  return value.toLocaleString(locale.value, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function txTypeLabel(type: string): string {
  const key = `referral.txType.${type}`;
  const translated = t(key);
  return translated !== key ? translated : type;
}

function txTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    referral_reward: 'card_giftcard',
    withdrawal: 'arrow_downward',
    bonus: 'star',
    adjustment: 'tune',
    reserved: 'lock',
    debited: 'remove_circle',
    refund: 'undo',
  };
  return icons[type] ?? 'swap_horiz';
}

function txTypeColor(type: string): string {
  const colors: Record<string, string> = {
    referral_reward: 'positive',
    withdrawal: 'negative',
    bonus: 'warning',
    adjustment: 'info',
    reserved: 'warning',
    debited: 'negative',
    refund: 'info',
  };
  return colors[type] ?? 'grey';
}
</script>
