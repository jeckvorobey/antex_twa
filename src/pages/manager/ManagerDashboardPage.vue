<template>
  <q-page class="manager-page manager-dashboard">
    <ManagerPageHeader
      :title="t('manager.dashboard.title')"
      :subtitle="t('manager.dashboard.subtitle')"
    />

    <section class="manager-dashboard__metrics" :aria-label="t('manager.dashboard.title')">
      <q-card flat class="manager-dashboard__metric antex-border-gold--muted">
        <q-icon name="receipt_long" size="20px" />
        <strong>{{ chatStore.orders.length }}</strong>
        <span>{{ t('manager.dashboard.activeOrders') }}</span>
      </q-card>
      <q-card flat class="manager-dashboard__metric antex-border-gold--muted">
        <q-icon name="mark_chat_unread" size="20px" />
        <strong>{{ chatStore.unreadTotal }}</strong>
        <span>{{ t('manager.dashboard.newChats') }}</span>
      </q-card>
    </section>

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

      <div v-if="chatStore.orders.length" class="manager-order-list">
        <OrderSummaryCard
          v-for="order in chatStore.orders.slice(0, 3)"
          :key="order.id"
          :order="order"
          @click="openOrder(order.id)"
        />
      </div>
      <q-card v-else flat class="manager-dashboard__empty antex-border-gold--muted">
        {{ t('manager.dashboard.empty') }}
      </q-card>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import ManagerPageHeader from '@components/manager/ManagerPageHeader.vue';
import OrderSummaryCard from '@components/manager/OrderSummaryCard.vue';
import { useManagerChatStore } from '@stores/manager-chat.store';

const chatStore = useManagerChatStore();
const router = useRouter();
const { t } = useI18n();

/** Открывает полный список активных заявок. */
function openOrders(): void {
  void router.push({ name: 'managerOrders' });
}

/** Открывает выбранную заявку из оперативной очереди. */
function openOrder(orderId: number): void {
  void router.push({ name: 'managerOrder', params: { orderId } });
}
</script>
