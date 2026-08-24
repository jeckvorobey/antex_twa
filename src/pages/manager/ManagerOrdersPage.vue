<template>
  <q-page class="manager-page" :aria-busy="chatStore.ordersLoading">
    <ManagerPageHeader
      :title="t('manager.orders.title')"
      :subtitle="t('manager.orders.subtitle')"
    />

    <div
      v-if="chatStore.ordersLoading && !chatStore.orders.length"
      class="column items-center q-gutter-y-sm q-py-md"
    >
      <AntexSkeleton preset="order-card" />
      <AntexSkeleton preset="order-card" />
    </div>
    <AntexEmptyState
      v-else-if="chatStore.ordersError"
      :title="t('manager.orders.error.title')"
      :description="t('manager.orders.error.text')"
      :action-label="t('common.retry')"
      icon="cloud_off"
      @action="loadOrders"
    />
    <AntexEmptyState
      v-else-if="!chatStore.orders.length"
      :title="t('manager.orders.empty.title')"
      :description="t('manager.orders.empty.text')"
      icon="receipt_long"
    />
    <div v-else class="manager-order-list">
      <OrderCard
        v-for="order in chatStore.orders"
        :key="order.id"
        :order="order"
        mode="manager"
        actions
        @open-chat="openChat(order.id)"
        @open-details="openDetails(order.id)"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useAntexNotify } from '@/composables/useAntexNotify';
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import ManagerPageHeader from '@components/manager/ManagerPageHeader.vue';
import OrderCard from '@components/orders/OrderCard.vue';
import AntexEmptyState from '@components/ui/AntexEmptyState.vue';
import AntexSkeleton from '@components/ui/AntexSkeleton.vue';
import { useManagerChatStore } from '@stores/manager-chat.store';

const router = useRouter();
const chatStore = useManagerChatStore();
const { t } = useI18n();
const { notify } = useAntexNotify();

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
    notify('negative', t('manager.orders.notifications.chatError'));
  }
}

function openDetails(orderId: number): void {
  void router.push({ name: 'managerOrder', params: { orderId } });
}
</script>
