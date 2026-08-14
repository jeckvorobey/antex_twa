<template>
  <q-page class="manager-page manager-page--chat">
    <ManagerPageHeader
      :title="conversationTitle"
      :subtitle="conversationSubtitle"
      back
      @back="goBack"
    >
      <template #trailing>
        <ConnectionStatePill :state="realtimeStore.state" />
      </template>
    </ManagerPageHeader>

    <div v-if="chatStore.messagesLoading && !chatStore.activeConversation" class="row justify-center q-py-xl">
      <q-spinner size="36px" color="primary" />
    </div>

    <template v-else-if="chatStore.activeConversation">
      <div v-if="chatStore.activeConversation.latestOrder" class="manager-chat-context">
        <OrderSummaryCard :order="chatStore.activeConversation.latestOrder" compact />
      </div>

      <div class="manager-chat-timeline">
        <q-btn
          v-if="chatStore.hasMoreMessages"
          flat
          dense
          rounded
          no-caps
          label="Показать предыдущие"
          :loading="chatStore.messagesLoading"
          class="manager-chat-load-earlier"
          @click="chatStore.loadEarlierMessages"
        />

        <template v-for="item in timelineItems" :key="item.key">
          <ChatDateDivider v-if="item.kind === 'date'" :label="item.label" />
          <ChatBubble v-else :message="item.message" />
        </template>

        <EmptyStateCard
          v-if="!chatStore.messages.length"
          title="История пока пустая"
          text="Можно написать клиенту первым — сообщение уйдёт через бота AntEx."
          icon="chat_bubble_outline"
        />
      </div>

      <ChatComposer
        :sending="chatStore.sending"
        @send="sendText"
        @send-file="sendFile"
      />
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { Notify } from 'quasar';
import { computed, nextTick, onBeforeUnmount, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import ChatBubble from '@components/manager/ChatBubble.vue';
import ChatComposer from '@components/manager/ChatComposer.vue';
import ChatDateDivider from '@components/manager/ChatDateDivider.vue';
import ConnectionStatePill from '@components/manager/ConnectionStatePill.vue';
import EmptyStateCard from '@components/manager/EmptyStateCard.vue';
import ManagerPageHeader from '@components/manager/ManagerPageHeader.vue';
import OrderSummaryCard from '@components/manager/OrderSummaryCard.vue';
import { useManagerChatStore } from '@stores/manager-chat.store';
import { useManagerRealtimeStore } from '@stores/manager-realtime.store';
import type { ManagerChatMessage } from '@types/manager-chat';
import { managerUserDisplayName } from '@utils/manager-chat';

interface DateTimelineItem {
  kind: 'date';
  key: string;
  label: string;
}

interface MessageTimelineItem {
  kind: 'message';
  key: string;
  message: ManagerChatMessage;
}

type TimelineItem = DateTimelineItem | MessageTimelineItem;

const route = useRoute();
const router = useRouter();
const chatStore = useManagerChatStore();
const realtimeStore = useManagerRealtimeStore();
const conversationId = computed(() => Number(route.params.conversationId));

const conversationTitle = computed(() =>
  chatStore.activeConversation
    ? managerUserDisplayName(chatStore.activeConversation.user)
    : 'Диалог',
);
const conversationSubtitle = computed(() => {
  const user = chatStore.activeConversation?.user;
  if (!user) {
    return 'Загрузка…';
  }
  return user.username ? `@${user.username}` : `Клиент #${user.id}`;
});

const timelineItems = computed<TimelineItem[]>(() => {
  const result: TimelineItem[] = [];
  let lastDay = '';
  for (const message of chatStore.messages) {
    const date = new Date(message.createdAt);
    const day = date.toISOString().slice(0, 10);
    if (day !== lastDay) {
      result.push({ kind: 'date', key: `date-${day}`, label: formatDay(date) });
      lastDay = day;
    }
    result.push({ kind: 'message', key: `message-${message.id}`, message });
  }
  return result;
});

onMounted(async () => {
  if (!Number.isFinite(conversationId.value)) {
    goBack();
    return;
  }
  realtimeStore.setViewing(conversationId.value);
  try {
    await chatStore.openConversation(conversationId.value);
    await scrollToBottom();
  } catch {
    Notify.create({ type: 'negative', message: 'Не удалось открыть диалог' });
    goBack();
  }
});

onBeforeUnmount(() => {
  realtimeStore.setViewing(null);
  chatStore.resetActiveConversation();
});

watch(
  () => chatStore.messages.length,
  () => {
    void scrollToBottom();
  },
);

function formatDay(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) {
    return 'Сегодня';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Вчера';
  }
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(date);
}

async function sendText(text: string): Promise<void> {
  try {
    await chatStore.sendMessage(text);
    await scrollToBottom();
  } catch {
    Notify.create({ type: 'negative', message: 'Сообщение не отправлено' });
  }
}

async function sendFile(file: File): Promise<void> {
  try {
    await chatStore.sendAttachment(file);
    await scrollToBottom();
  } catch {
    Notify.create({ type: 'negative', message: 'Вложение не отправлено' });
  }
}

async function scrollToBottom(): Promise<void> {
  await nextTick();
  window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
}

function goBack(): void {
  void router.push({ name: 'managerChats' });
}
</script>
