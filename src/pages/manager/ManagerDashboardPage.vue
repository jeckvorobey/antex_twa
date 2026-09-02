<template>
  <q-page
    class="manager-page manager-dashboard column no-wrap"
    :aria-busy="chatStore.ordersLoading"
  >
    <AppHeaderBar :eyebrow="t('manager.role')" profile-route-name="managerProfile" />

    <h1 class="manager-dashboard__date">{{ dashboardDate }}</h1>

    <section class="manager-dashboard__metrics" :aria-label="t('manager.dashboard.title')">
      <ManagerDashboardKpi
        :label="t('manager.dashboard.active')"
        :value="chatStore.ordersTotal"
        :trend="t('manager.dashboard.ordersToday', { count: chatStore.ordersTodayTotal })"
        tone="positive"
      />
      <ManagerDashboardKpi
        :label="t('manager.dashboard.chatsLabel')"
        :value="chatStore.dashboardChatTotal"
        :trend="t('manager.dashboard.unreadChats', { count: chatStore.unreadTotal })"
      />
    </section>

    <p v-if="activeOrderTotals" class="manager-dashboard__totals">
      {{ t('manager.dashboard.activeOrderTotals', { total: activeOrderTotals }) }}
    </p>

    <section class="manager-dashboard__queue column no-wrap col-grow">
      <div class="manager-dashboard__section-heading">
        <h2>{{ t('manager.dashboard.queue') }}</h2>
        <q-btn
          flat
          dense
          no-caps
          color="primary"
          :label="t('manager.dashboard.viewAll')"
          :aria-label="t('manager.dashboard.viewAll')"
          @click="openOrders"
        >
          <q-tooltip>{{ t('manager.dashboard.viewAll') }}</q-tooltip>
        </q-btn>
      </div>

      <div
        v-if="chatStore.ordersError && chatStore.orders.length"
        class="manager-dashboard__refresh-error"
        role="status"
        aria-live="polite"
      >
        <span>{{ t('manager.dashboard.refreshError') }}</span>
        <q-btn
          flat
          round
          dense
          icon="refresh"
          class="manager-dashboard__refresh-retry"
          :aria-label="t('common.retry')"
          @click="loadOrders"
        >
          <q-tooltip>{{ t('common.retry') }}</q-tooltip>
        </q-btn>
      </div>

      <div
        v-if="chatStore.ordersLoading && !chatStore.orders.length"
        class="manager-dashboard__loading"
      >
        <AntexSkeleton preset="cell" />
        <AntexSkeleton preset="cell" />
      </div>
      <AntexEmptyState
        v-else-if="chatStore.ordersError && !chatStore.orders.length"
        :title="t('manager.orders.error.title')"
        :description="t('manager.orders.error.text')"
        :action-label="t('common.retry')"
        icon="cloud_off"
        @action="loadOrders"
      />
      <ManagerActiveOrderQueue
        v-else-if="chatStore.orders.length"
        :orders="chatStore.orders"
        @select="openOrder"
      >
        <template #pagination>
          <ManagerListMore
            :has-more="chatStore.hasMoreOrders"
            :loading="chatStore.ordersLoading"
            :error="Boolean(chatStore.ordersMoreError)"
            @load="loadMoreOrders"
          />
        </template>
      </ManagerActiveOrderQueue>
      <AntexCard v-else :elevated="false" class="manager-dashboard__empty">
        {{ t('manager.dashboard.empty') }}
      </AntexCard>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import ManagerActiveOrderQueue from '@components/manager/ManagerActiveOrderQueue.vue';
import ManagerDashboardKpi from '@components/manager/ManagerDashboardKpi.vue';
import ManagerListMore from '@components/manager/ManagerListMore.vue';
import AntexCard from '@components/ui/AntexCard.vue';
import AntexEmptyState from '@components/ui/AntexEmptyState.vue';
import AntexSkeleton from '@components/ui/AntexSkeleton.vue';
import AppHeaderBar from '@components/ui/AppHeaderBar.vue';
import { useManagerChatStore } from '@stores/manager-chat.store';
import {
  formatManagerDashboardDate,
  millisecondsUntilNextLocalDay,
} from '@utils/manager-dashboard';

const chatStore = useManagerChatStore();
const router = useRouter();
const { locale, t } = useI18n();
const now = ref(new Date());
let dayRefreshTimer: ReturnType<typeof setTimeout> | undefined;
const dashboardDate = computed(() =>
  formatManagerDashboardDate(now.value, locale.value, t('manager.dashboard.today')),
);
const activeOrderTotals = computed(() =>
  Object.entries(chatStore.ordersAmountTotals)
    .map(
      ([currency, amount]) =>
        `${new Intl.NumberFormat(locale.value, { maximumFractionDigits: 2 }).format(amount)} ${currency}`,
    )
    .join(' · '),
);

function scheduleNextDayRefresh(): void {
  const current = new Date();
  now.value = current;
  dayRefreshTimer = setTimeout(() => {
    void loadOrders();
    scheduleNextDayRefresh();
  }, millisecondsUntilNextLocalDay(current));
}

onMounted(() => {
  scheduleNextDayRefresh();
  void chatStore.loadDashboardChatTotal().catch(() => undefined);
});

onBeforeUnmount(() => {
  if (dayRefreshTimer !== undefined) clearTimeout(dayRefreshTimer);
});

/** Открывает полный список активных заявок. */
function openOrders(): void {
  void router.push({ name: 'managerOrders' });
}

async function loadOrders(): Promise<void> {
  try {
    await chatStore.loadOrders();
  } catch {
    // Ошибка представлена отдельным retryable state из store.
  }
}

async function loadMoreOrders(): Promise<void> {
  try {
    await chatStore.loadMoreOrders();
  } catch {
    // Повтор страницы доступен внутри очереди.
  }
}

/** Открывает выбранную заявку из оперативной очереди. */
function openOrder(orderId: number): void {
  void router.push({ name: 'managerOrder', params: { orderId } });
}
</script>
