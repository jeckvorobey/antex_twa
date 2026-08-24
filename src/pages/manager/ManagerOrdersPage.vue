<template>
  <q-page class="manager-page">
    <ManagerPageHeader
      :title="t('manager.orders.title')"
      :subtitle="t('manager.orders.subtitle')"
    />

    <div v-if="chatStore.ordersLoading && !chatStore.orders.length" class="row justify-center q-py-xl">
      <q-spinner size="36px" color="primary" />
    </div>
    <EmptyStateCard
      v-else-if="chatStore.ordersError"
      :title="t('manager.orders.error.title')"
      :text="t('manager.orders.error.text')"
      :action-label="t('common.retry')"
      icon="cloud_off"
      @action="loadOrders"
    />
    <EmptyStateCard
      v-else-if="!chatStore.orders.length"
      :title="t('manager.orders.empty.title')"
      :text="t('manager.orders.empty.text')"
      icon="receipt_long"
    />
    <div v-else class="manager-order-list">
      <OrderSummaryCard
        v-for="order in chatStore.orders"
        :key="order.id"
        :order="order"
        actions
        @open-chat="openChat(order.id)"
        @open-details="openDetails(order.id)"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { Notify } from 'quasar';
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import EmptyStateCard from '@components/manager/EmptyStateCard.vue';
import ManagerPageHeader from '@components/manager/ManagerPageHeader.vue';
import OrderSummaryCard from '@components/manager/OrderSummaryCard.vue';
import { useManagerChatStore } from '@stores/manager-chat.store';

const router = useRouter();
const chatStore = useManagerChatStore();
const { t } = useI18n();

onMounted(() => {
  void loadOrders();
});

async function loadOrders(): Promise<void> {
  try {
    await chatStore.loadOrders();
  } catch {
    // Ошибка представлена отдельным retryable state из store.
  }
}

async function openChat(orderId: number): Promise<void> {
  try {
    const conversation = await chatStore.ensureOrderChat(orderId);
    await router.push({ name: 'managerChat', params: { conversationId: conversation.id } });
  } catch {
    Notify.create({ type: 'negative', message: t('manager.orders.notifications.chatError') });
  }
}

function openDetails(orderId: number): void {
  void router.push({ name: 'managerOrder', params: { orderId } });
}
</script>
