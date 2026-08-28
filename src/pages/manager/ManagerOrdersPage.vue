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
        selectable
        :pending-actions="pendingStatusActions(order.id)"
        @open-details="openDetails(order.id)"
        @open-chat="openChat(order.id)"
        @select="openDetails(order.id)"
        @take="setStatus(order.id, 2)"
        @complete="setStatus(order.id, 3)"
        @cancel="confirmCancel(order.id)"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useAntexNotify } from '@/composables/useAntexNotify';
import { Dialog } from 'quasar';
import { onMounted, ref } from 'vue';
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
const statusActionLocks = ref<Set<number>>(new Set());
const statusActionKeys = ['take', 'complete', 'cancel'];

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

function pendingStatusActions(orderId: number): string[] {
  return statusActionLocks.value.has(orderId) ? statusActionKeys : [];
}

function lockStatusActions(orderId: number): boolean {
  if (statusActionLocks.value.has(orderId)) return false;
  const nextLocks = new Set(statusActionLocks.value);
  nextLocks.add(orderId);
  statusActionLocks.value = nextLocks;
  return true;
}

function unlockStatusActions(orderId: number): void {
  const nextLocks = new Set(statusActionLocks.value);
  nextLocks.delete(orderId);
  statusActionLocks.value = nextLocks;
}

async function setStatus(
  orderId: number,
  status: number,
  options: { lock?: boolean } = {},
): Promise<void> {
  const shouldLock = options.lock !== false;
  if (shouldLock && !lockStatusActions(orderId)) return;
  try {
    await chatStore.changeOrderStatus(orderId, status);
    notify('positive', t('manager.orderPage.notifications.statusUpdated'));
  } catch {
    notify('negative', t('manager.orderPage.notifications.statusError'));
  } finally {
    unlockStatusActions(orderId);
  }
}

function confirmCancel(orderId: number): void {
  if (!lockStatusActions(orderId)) return;
  let confirmed = false;
  Dialog.create({
    title: t('manager.orderPage.cancelDialog.title'),
    message: t('manager.orderPage.cancelDialog.text'),
    cancel: { label: t('common.back'), flat: true },
    ok: { label: t('manager.orderPage.actions.cancel'), color: 'negative' },
    persistent: true,
  }).onOk(() => {
    confirmed = true;
    void setStatus(orderId, 4, { lock: false });
  }).onDismiss(() => {
    if (!confirmed) unlockStatusActions(orderId);
  });
}
</script>
