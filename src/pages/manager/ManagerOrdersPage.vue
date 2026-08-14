<template>
  <q-page class="manager-page">
    <ManagerPageHeader title="Заявки" subtitle="Текущая операционная работа" />

    <div v-if="chatStore.ordersLoading && !chatStore.orders.length" class="row justify-center q-py-xl">
      <q-spinner size="36px" color="primary" />
    </div>
    <EmptyStateCard
      v-else-if="!chatStore.orders.length"
      title="Активных заявок нет"
      text="Новые заявки появятся здесь автоматически."
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
import { useRouter } from 'vue-router';

import EmptyStateCard from '@components/manager/EmptyStateCard.vue';
import ManagerPageHeader from '@components/manager/ManagerPageHeader.vue';
import OrderSummaryCard from '@components/manager/OrderSummaryCard.vue';
import { useManagerChatStore } from '@stores/manager-chat.store';

const router = useRouter();
const chatStore = useManagerChatStore();

onMounted(() => {
  void chatStore.loadOrders();
});

async function openChat(orderId: number): Promise<void> {
  try {
    const conversation = await chatStore.ensureOrderChat(orderId);
    await router.push({ name: 'managerChat', params: { conversationId: conversation.id } });
  } catch {
    Notify.create({ type: 'negative', message: 'Не удалось открыть чат клиента' });
  }
}

function openDetails(orderId: number): void {
  void router.push({ name: 'managerOrder', params: { orderId } });
}
</script>
