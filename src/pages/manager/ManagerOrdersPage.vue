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
        :disabled-actions="statusActionLocks.has(order.id) ? statusActionKeys : []"
        @open-details="openDetails(order.id)"
        @open-chat="openChat(order.id)"
        @select="openDetails(order.id)"
        @take="setStatus(order.id, 2)"
        @complete="setStatus(order.id, 3)"
        @cancel="confirmCancel(order.id)"
      />
    </div>
    <ManagerListMore
      v-if="!chatStore.ordersError"
      :has-more="chatStore.hasMoreOrders"
      :loading="chatStore.ordersLoading"
      :error="Boolean(chatStore.ordersMoreError)"
      @load="loadMoreOrders"
    />
  </q-page>
</template>

<script setup lang="ts">
import { useAntexNotify } from '@/composables/useAntexNotify';
import { Dialog } from 'quasar';
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import ManagerPageHeader from '@components/manager/ManagerPageHeader.vue';
import ManagerListMore from '@components/manager/ManagerListMore.vue';
import OrderCard from '@components/orders/OrderCard.vue';
import AntexEmptyState from '@components/ui/AntexEmptyState.vue';
import AntexSkeleton from '@components/ui/AntexSkeleton.vue';
import { useManagerChatStore } from '@stores/manager-chat.store';

const router = useRouter();
const chatStore = useManagerChatStore();
const { t } = useI18n();
const { notify } = useAntexNotify();
const statusActionLocks = ref<Set<number>>(new Set());
const pendingStatuses = ref<Map<number, number>>(new Map());
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

async function loadMoreOrders(): Promise<void> {
  try {
    await chatStore.loadMoreOrders();
  } catch {
    // Повтор страницы доступен под сохранённым списком.
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

/** Показывает загрузку только на кнопке выполняемого запроса. */
function pendingStatusActions(orderId: number): string[] {
  const status = pendingStatuses.value.get(orderId);
  const key = status === 2 ? 'take' : status === 3 ? 'complete' : status === 4 ? 'cancel' : null;
  return key ? [key] : [];
}

/** Блокирует конкурирующие изменения одной заявки, включая время подтверждения. */
function lockStatusActions(orderId: number): boolean {
  if (statusActionLocks.value.has(orderId)) return false;
  const nextLocks = new Set(statusActionLocks.value);
  nextLocks.add(orderId);
  statusActionLocks.value = nextLocks;
  return true;
}

/** Освобождает заявку после ответа сервера либо отказа от отмены. */
function unlockStatusActions(orderId: number): void {
  pendingStatuses.value.delete(orderId);
  const nextLocks = new Set(statusActionLocks.value);
  nextLocks.delete(orderId);
  statusActionLocks.value = nextLocks;
}

/** Отправляет один запрос смены статуса и всегда снимает блокировку. */
async function setStatus(
  orderId: number,
  status: number,
  options: { lock?: boolean } = {},
): Promise<void> {
  const shouldLock = options.lock !== false;
  if (shouldLock && !lockStatusActions(orderId)) return;
  pendingStatuses.value.set(orderId, status);
  try {
    await chatStore.changeOrderStatus(orderId, status);
    notify('positive', t('manager.orderPage.notifications.statusUpdated'));
  } catch {
    notify('negative', t('manager.orderPage.notifications.statusError'));
  } finally {
    unlockStatusActions(orderId);
  }
}

/** Запрашивает подтверждение до включения загрузки отмены. */
function confirmCancel(orderId: number): void {
  if (!lockStatusActions(orderId)) return;
  let confirmed = false;
  Dialog.create({
    title: t('manager.orderPage.cancelDialog.title'),
    message: t('manager.orderPage.cancelDialog.text'),
    cancel: { label: t('common.back'), flat: true },
    ok: { label: t('manager.orderPage.actions.cancel'), color: 'negative' },
    persistent: true,
  })
    .onOk(() => {
      confirmed = true;
      void setStatus(orderId, 4, { lock: false });
    })
    .onDismiss(() => {
      if (!confirmed) unlockStatusActions(orderId);
    });
}
</script>
