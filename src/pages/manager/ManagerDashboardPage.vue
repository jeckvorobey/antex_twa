<template>
  <q-page class="manager-page manager-dashboard">
    <AppHeaderBar :eyebrow="t('manager.role')" profile-route-name="managerProfile" />

    <h1 class="manager-dashboard__date">{{ dashboardDate }}</h1>

    <section class="manager-dashboard__metrics" :aria-label="t('manager.dashboard.title')">
      <ManagerDashboardKpi
        :label="t('manager.dashboard.active')"
        :value="chatStore.orders.length"
        :trend="t('manager.dashboard.ordersToday', { count: ordersToday })"
        tone="positive"
      />
      <ManagerDashboardKpi
        :label="t('manager.dashboard.chatsLabel')"
        :value="chatStore.total"
        :trend="t('manager.dashboard.unreadChats', { count: chatStore.unreadTotal })"
      />
    </section>

    <p v-if="activeOrderTotals" class="manager-dashboard__totals">
      {{ t('manager.dashboard.activeOrderTotals', { total: activeOrderTotals }) }}
    </p>

    <section class="manager-dashboard__queue">
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

      <ManagerActiveOrderQueue
        v-if="chatStore.orders.length"
        :orders="chatStore.orders"
        :view-all-label="t('manager.dashboard.viewAll')"
        @select="openOrder"
        @view-all="openOrders"
      />
      <AntexCard v-else :elevated="false" class="manager-dashboard__empty">
        {{ t('manager.dashboard.empty') }}
      </AntexCard>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import ManagerActiveOrderQueue from '@components/manager/ManagerActiveOrderQueue.vue';
import ManagerDashboardKpi from '@components/manager/ManagerDashboardKpi.vue';
import AntexCard from '@components/ui/AntexCard.vue';
import AppHeaderBar from '@components/ui/AppHeaderBar.vue';
import { useManagerChatStore } from '@stores/manager-chat.store';
import {
  countTodayOrders,
  formatActiveOrderTotals,
  formatManagerDashboardDate,
} from '@utils/manager-dashboard';

const chatStore = useManagerChatStore();
const router = useRouter();
const { locale, t } = useI18n();
const now = new Date();
const dashboardDate = computed(() =>
  formatManagerDashboardDate(now, locale.value, t('manager.dashboard.today')),
);
const ordersToday = computed(() => countTodayOrders(chatStore.orders, now));
const activeOrderTotals = computed(() =>
  formatActiveOrderTotals(chatStore.orders, locale.value),
);

/** Открывает полный список активных заявок. */
function openOrders(): void {
  void router.push({ name: 'managerOrders' });
}

/** Открывает выбранную заявку из оперативной очереди. */
function openOrder(orderId: number): void {
  void router.push({ name: 'managerOrder', params: { orderId } });
}
</script>
