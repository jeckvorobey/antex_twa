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

    <AntexEmptyState
      v-else-if="chatStore.activeConversationError"
      :title="t('manager.chat.error.title')"
      :description="t('manager.chat.error.text')"
      :action-label="t('common.retry')"
      icon="cloud_off"
      @action="loadConversation"
    />

    <template v-else-if="chatStore.activeConversation">
      <div v-if="chatStore.activeConversation.latestOrder" class="manager-chat-context">
        <OrderCard
          :order="chatStore.activeConversation.latestOrder"
          mode="manager"
          compact
          :actions="false"
        />
      </div>

      <div class="manager-chat-timeline">
        <q-btn
          v-if="chatStore.hasMoreMessages"
          flat
          dense
          rounded
          no-caps
          :label="t('manager.chat.loadEarlier')"
          :loading="chatStore.messagesLoading"
          class="manager-chat-load-earlier"
          @click="loadEarlierMessages"
        />

        <template v-for="item in timelineItems" :key="item.key">
          <ChatDateDivider v-if="item.kind === 'date'" :label="item.label" />
          <ChatBubble v-else :message="item.message" />
        </template>

        <AntexEmptyState
          v-if="!chatStore.messages.length"
          :title="t('manager.chat.empty.title')"
          :description="t('manager.chat.empty.text')"
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
import { useAntexNotify } from '@/composables/useAntexNotify';
import { computed, nextTick, onBeforeUnmount, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import ChatBubble from '@components/manager/ChatBubble.vue';
import ChatComposer from '@components/manager/ChatComposer.vue';
import ChatDateDivider from '@components/manager/ChatDateDivider.vue';
import ConnectionStatePill from '@components/manager/ConnectionStatePill.vue';
import AntexEmptyState from '@components/ui/AntexEmptyState.vue';
import ManagerPageHeader from '@components/manager/ManagerPageHeader.vue';
import OrderCard from '@components/orders/OrderCard.vue';
import { useManagerChatStore } from '@stores/manager-chat.store';
import { useManagerRealtimeStore } from '@stores/manager-realtime.store';
import type { ManagerChatMessage } from '@types/manager-chat';
import { managerUserFullName } from '@utils/manager-chat';
import { localDateKey } from '@utils/date-groups';

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
const { locale, t } = useI18n();
const { notify } = useAntexNotify();
const conversationId = computed(() => Number(route.params.conversationId));

const conversationTitle = computed(() =>
  chatStore.activeConversation
    ? managerUserFullName(chatStore.activeConversation.user) ||
      t('manager.customerFallback', { id: chatStore.activeConversation.user.id })
    : t('manager.chat.title'),
);
const conversationSubtitle = computed(() => {
  const user = chatStore.activeConversation?.user;
  if (!user) {
    return t('manager.chat.loading');
  }
  return user.username ? `@${user.username}` : t('manager.customerFallback', { id: user.id });
});

const timelineItems = computed<TimelineItem[]>(() => {
  const result: TimelineItem[] = [];
  let lastDay = '';
  for (const message of chatStore.messages) {
    const date = new Date(message.createdAt);
    const day = localDateKey(date);
    if (day !== lastDay) {
      result.push({ kind: 'date', key: `date-${day}`, label: formatDay(date) });
      lastDay = day;
    }
    result.push({ kind: 'message', key: `message-${message.id}`, message });
  }
  return result;
});

onMounted(() => {
  if (!Number.isFinite(conversationId.value)) {
    goBack();
    return;
  }
  realtimeStore.setViewing(conversationId.value);
  void loadConversation();
});

watch(conversationId, (nextId, previousId) => {
  if (nextId === previousId) return;
  if (!Number.isFinite(nextId)) {
    goBack();
    return;
  }
  realtimeStore.setViewing(nextId);
  void loadConversation();
});

async function loadConversation(): Promise<void> {
  try {
    await chatStore.openConversation(conversationId.value);
    await scrollToBottom();
  } catch {
    // Ошибка представлена отдельным retryable state из store.
  }
}

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
    return t('manager.chat.timeline.today');
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return t('manager.chat.timeline.yesterday');
  }
  return new Intl.DateTimeFormat(locale.value, { day: 'numeric', month: 'long' }).format(date);
}

async function loadEarlierMessages(): Promise<void> {
  try {
    await chatStore.loadEarlierMessages();
  } catch {
    notify('negative', t('manager.chat.notifications.loadEarlierError'));
  }
}

async function sendText(text: string): Promise<void> {
  try {
    await chatStore.sendMessage(text);
    await scrollToBottom();
  } catch {
    notify('negative', t('manager.chat.notifications.messageError'));
  }
}

async function sendFile(file: File): Promise<void> {
  try {
    await chatStore.sendAttachment(file);
    await scrollToBottom();
  } catch {
    notify('negative', t('manager.chat.notifications.attachmentError'));
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
