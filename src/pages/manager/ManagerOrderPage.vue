<template>
  <q-page class="manager-page">
    <ManagerPageHeader title="Заявка" subtitle="Операционная карточка" back @back="goBack" />

    <div v-if="loading" class="row justify-center q-py-xl">
      <q-spinner size="36px" color="primary" />
    </div>
    <template v-else-if="order">
      <OrderSummaryCard :order="order" />

      <div class="manager-order-actions">
        <q-btn
          unelevated
          rounded
          no-caps
          icon="forum"
          label="Открыть чат клиента"
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
          label="Взять в работу"
          :loading="changingStatus"
          @click="setStatus(2)"
        />
        <template v-if="order.status === 2">
          <q-btn
            outline
            rounded
            no-caps
            color="primary"
            icon="done_all"
            label="Завершить заявку"
            :loading="changingStatus"
            @click="setStatus(3)"
          />
          <q-btn
            flat
            rounded
            no-caps
            color="negative"
            icon="close"
            label="Отменить заявку"
            :disable="changingStatus"
            @click="confirmCancel"
          />
        </template>
      </div>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { Dialog, Notify } from 'quasar';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import ManagerPageHeader from '@components/manager/ManagerPageHeader.vue';
import OrderSummaryCard from '@components/manager/OrderSummaryCard.vue';
import { useManagerChatStore } from '@stores/manager-chat.store';

const route = useRoute();
const router = useRouter();
const chatStore = useManagerChatStore();
const loading = ref(true);
const changingStatus = ref(false);
const orderId = computed(() => Number(route.params.orderId));
const order = computed(() => chatStore.activeOrder);

onMounted(async () => {
  if (!Number.isFinite(orderId.value)) {
    goBack();
    return;
  }
  try {
    await chatStore.loadOrder(orderId.value);
  } catch {
    Notify.create({ type: 'negative', message: 'Заявка не найдена' });
    goBack();
  } finally {
    loading.value = false;
  }
});

async function openChat(): Promise<void> {
  try {
    const conversation = await chatStore.ensureOrderChat(orderId.value);
    await router.push({ name: 'managerChat', params: { conversationId: conversation.id } });
  } catch {
    Notify.create({ type: 'negative', message: 'Не удалось открыть чат клиента' });
  }
}

async function setStatus(status: number): Promise<void> {
  changingStatus.value = true;
  try {
    await chatStore.changeOrderStatus(orderId.value, status);
    await chatStore.loadOrders();
    Notify.create({ type: 'positive', message: 'Статус заявки обновлён' });
  } catch {
    Notify.create({ type: 'negative', message: 'Не удалось изменить статус заявки' });
  } finally {
    changingStatus.value = false;
  }
}

function confirmCancel(): void {
  Dialog.create({
    title: 'Отменить заявку?',
    message: 'Статус будет сохранён, клиент получит уведомление через бота.',
    cancel: { label: 'Назад', flat: true },
    ok: { label: 'Отменить заявку', color: 'negative' },
    persistent: true,
  }).onOk(() => {
    void setStatus(4);
  });
}

function goBack(): void {
  void router.push({ name: 'managerOrders' });
}
</script>
