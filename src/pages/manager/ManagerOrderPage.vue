<template>
  <q-page class="manager-page">
    <ManagerPageHeader
      :title="t('manager.orderPage.title')"
      :subtitle="t('manager.orderPage.subtitle')"
      back
      @back="goBack"
    />

    <div v-if="loading" class="row justify-center q-py-xl">
      <q-spinner size="36px" color="primary" />
    </div>
    <AntexEmptyState
      v-else-if="chatStore.activeOrderError"
      :title="t('manager.orderPage.error.title')"
      :description="t('manager.orderPage.error.text')"
      :action-label="t('common.retry')"
      icon="cloud_off"
      @action="loadOrder"
    />
    <template v-else-if="order">
      <OrderCard :order="order" mode="manager" :actions="false" />
      <ManagerOrderDetails :order="order" />

      <div class="manager-order-actions">
        <q-btn
          unelevated
          rounded
          no-caps
          icon="forum"
          :label="t('manager.orderPage.actions.chat')"
          class="manager-gold-button"
          @click="openChat"
        />
        <q-btn
          v-if="order.status === 1"
          outline
          rounded
          no-caps
          color="primary"
          icon="play_arrow"
          :label="t('manager.orderPage.actions.take')"
          :loading="pendingStatus === 2"
          :disable="changingStatus"
          @click="setStatus(2)"
        />
        <template v-if="order.status === 2">
          <q-btn
            outline
            rounded
            no-caps
            color="primary"
            icon="done_all"
            :label="t('manager.orderPage.actions.complete')"
            :loading="pendingStatus === 3"
            :disable="changingStatus"
            @click="setStatus(3)"
          />
          <q-btn
            flat
            rounded
            no-caps
            color="negative"
            icon="close"
            :label="t('manager.orderPage.actions.cancel')"
            :disable="changingStatus"
            :loading="pendingStatus === 4"
            @click="confirmCancel"
          />
        </template>
      </div>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { Dialog } from 'quasar';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import AntexEmptyState from '@components/ui/AntexEmptyState.vue';
import ManagerPageHeader from '@components/manager/ManagerPageHeader.vue';
import ManagerOrderDetails from '@components/manager/ManagerOrderDetails.vue';
import OrderCard from '@components/orders/OrderCard.vue';
import { useAntexNotify } from '@/composables/useAntexNotify';
import { useManagerChatStore } from '@stores/manager-chat.store';

const route = useRoute();
const router = useRouter();
const chatStore = useManagerChatStore();
const { t } = useI18n();
const { notify } = useAntexNotify();
const loading = ref(true);
const changingStatus = ref(false);
const pendingStatus = ref<number | null>(null);
const orderId = computed(() => Number(route.params.orderId));
const order = computed(() => chatStore.activeOrder);

onMounted(() => {
  if (!Number.isFinite(orderId.value)) {
    goBack();
    return;
  }
  void loadOrder();
});

watch(orderId, (nextId, previousId) => {
  if (nextId === previousId) return;
  if (!Number.isFinite(nextId)) {
    goBack();
    return;
  }
  void loadOrder();
});

async function loadOrder(): Promise<void> {
  loading.value = true;
  try {
    await chatStore.loadOrder(orderId.value);
  } catch {
    // Ошибка представлена отдельным retryable state из store.
  } finally {
    loading.value = false;
  }
}

async function openChat(): Promise<void> {
  try {
    const conversation = await chatStore.ensureOrderChat(orderId.value);
    await router.push({ name: 'managerChat', params: { conversationId: conversation.id } });
  } catch {
    notify('negative', t('manager.orders.notifications.chatError'));
  }
}

/** Сохраняет статус один раз и показывает загрузку выбранного действия. */
async function setStatus(status: number, confirmed = false): Promise<void> {
  if (changingStatus.value && !confirmed) return;
  changingStatus.value = true;
  pendingStatus.value = status;
  try {
    await chatStore.changeOrderStatus(orderId.value, status);
    await chatStore.loadOrders();
    notify('positive', t('manager.orderPage.notifications.statusUpdated'));
  } catch {
    notify('negative', t('manager.orderPage.notifications.statusError'));
  } finally {
    changingStatus.value = false;
    pendingStatus.value = null;
  }
}

/** Блокирует действия на время подтверждения без преждевременного лоадера. */
function confirmCancel(): void {
  if (changingStatus.value) return;
  changingStatus.value = true;
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
      void setStatus(4, true);
    })
    .onDismiss(() => {
      if (!confirmed) changingStatus.value = false;
    });
}

function goBack(): void {
  void router.push({ name: 'managerOrders' });
}
</script>
