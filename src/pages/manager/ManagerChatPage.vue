<template>
  <q-page
    class="manager-page manager-page--chat"
    :style="{ '--chat-composer-height': `${composerHeight}px` }"
  >
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

    <div
      v-if="chatStore.messagesLoading && !chatStore.activeConversation"
      class="row justify-center q-py-xl"
    >
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
          <ChatBubble
            v-else
            :message="item.message"
            :group-start="item.groupStart"
            :group-end="item.groupEnd"
            :reply-label="replyPreview(item.message.replyToMessageId)"
            @reply="replyTo = $event"
            @forward="selectForward"
          />
        </template>

        <AntexEmptyState
          v-if="!chatStore.messages.length"
          :title="t('manager.chat.empty.title')"
          :description="t('manager.chat.empty.text')"
          icon="chat_bubble_outline"
        />
      </div>

      <ChatComposer
        :key="conversationId"
        ref="composer"
        v-model="draftText"
        :reply-label="replyTo ? managerMessagePreview(replyTo, t) : undefined"
        :sending="chatStore.sending"
        @send="sendText"
        @send-file="selectFile"
        @send-recording="sendRecording"
        @cancel-reply="replyTo = null"
        @height="composerHeight = $event"
      />
      <q-dialog v-model="fileDialog" :persistent="chatStore.sending">
        <q-card class="manager-chat-forward">
          <q-card-section>{{ pendingFile?.name }}</q-card-section>
          <q-card-actions align="right">
            <q-btn
              v-close-popup
              flat
              no-caps
              :disable="chatStore.sending"
              :label="t('common.cancel')"
            />
            <q-btn
              color="primary"
              text-color="black"
              no-caps
              :loading="chatStore.sending"
              :label="t('manager.chat.composer.send')"
              @click="pendingFile && sendFile(pendingFile)"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
      <ChatForwardDialog
        v-model="forwardDialog"
        :sending="chatStore.sending"
        @forward="forwardMessage"
      />
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { useAntexNotify } from '@/composables/useAntexNotify';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import ChatBubble from '@components/manager/ChatBubble.vue';
import ChatComposer from '@components/manager/ChatComposer.vue';
import ChatForwardDialog from '@components/manager/ChatForwardDialog.vue';
import ChatDateDivider from '@components/manager/ChatDateDivider.vue';
import ConnectionStatePill from '@components/manager/ConnectionStatePill.vue';
import AntexEmptyState from '@components/ui/AntexEmptyState.vue';
import ManagerPageHeader from '@components/manager/ManagerPageHeader.vue';
import { useManagerChatStore } from '@stores/manager-chat.store';
import { useManagerRealtimeStore } from '@stores/manager-realtime.store';
import type { ManagerChatMessage } from '@types/manager-chat';
import {
  managerScrollBehavior,
  managerMessagePreview,
  managerUserFullName,
  shouldAutoScrollMessages,
} from '@utils/manager-chat';
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
  groupStart: boolean;
  groupEnd: boolean;
}

type TimelineItem = DateTimelineItem | MessageTimelineItem;

const route = useRoute();
const router = useRouter();
const chatStore = useManagerChatStore();
const realtimeStore = useManagerRealtimeStore();
const { locale, t } = useI18n();
const { notify } = useAntexNotify();
const reducedMotionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
const conversationId = computed(() => Number(route.params.conversationId));
const draftText = ref('');
const composer = ref<InstanceType<typeof ChatComposer> | null>(null);
const composerHeight = ref(54);
const replyTo = ref<ManagerChatMessage | null>(null);
const forwardSource = ref<ManagerChatMessage | null>(null);
const forwardDialog = ref(false);
const pendingFile = ref<File | null>(null);
const fileDialog = ref(false);
let draftGeneration = 0;

/** Возвращает краткий текст выбранного ответа из загруженной истории. */
function replyPreview(messageId: number | null): string | undefined {
  const message = chatStore.messages.find((message) => message.id === messageId);
  return message ? managerMessagePreview(message, t) : undefined;
}

/** Открывает выбор получателя для конкретного исходного сообщения. */
function selectForward(message: ManagerChatMessage): void {
  forwardSource.value = message;
  forwardDialog.value = true;
}

/** Хранит выбранный файл до отправки, чтобы сетевую ошибку можно было повторить. */
function selectFile(file: File): void {
  pendingFile.value = file;
  fileDialog.value = true;
}

/** Пересылает только после явного подтверждения получателя в диалоге. */
async function forwardMessage(target: number): Promise<void> {
  if (!forwardSource.value) return;
  const generation = draftGeneration;
  try {
    const result = await chatStore.forwardMessage(forwardSource.value.id, target);
    if (generation !== draftGeneration || !result) return;
    forwardDialog.value = false;
    forwardSource.value = null;
    notify('positive', t('manager.chat.forward.sent'));
  } catch {
    if (generation === draftGeneration) notify('negative', t('manager.chat.forward.error'));
  }
}

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

/** Объединяет соседей одного направления, не пересекая разделитель даты. */
function sameMessageGroup(
  message: ManagerChatMessage,
  neighbor: ManagerChatMessage | undefined,
): boolean {
  return (
    !!neighbor &&
    message.direction === neighbor.direction &&
    localDateKey(new Date(message.createdAt)) === localDateKey(new Date(neighbor.createdAt))
  );
}

const timelineItems = computed<TimelineItem[]>(() => {
  const result: TimelineItem[] = [];
  let lastDay = '';
  for (const [index, message] of chatStore.messages.entries()) {
    const date = new Date(message.createdAt);
    const day = localDateKey(date);
    if (day !== lastDay) {
      result.push({ kind: 'date', key: `date-${day}`, label: formatDay(date) });
      lastDay = day;
    }
    result.push({
      kind: 'message',
      key: `message-${message.id}`,
      message,
      groupStart: !sameMessageGroup(message, chatStore.messages[index - 1]),
      groupEnd: !sameMessageGroup(message, chatStore.messages[index + 1]),
    });
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
  ++draftGeneration;
  draftText.value = '';
  replyTo.value = null;
  pendingFile.value = null;
  fileDialog.value = false;
  forwardSource.value = null;
  forwardDialog.value = false;
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
  ++draftGeneration;
  realtimeStore.setViewing(null);
  chatStore.resetActiveConversation();
});

watch(
  () => chatStore.messages.at(-1)?.id ?? null,
  (nextLatestId, previousLatestId) => {
    if (shouldAutoScrollMessages(previousLatestId, nextLatestId)) {
      void scrollToBottom();
    }
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

/** Очищает только тот draft и reply, для которых подтверждена доставка. */
async function sendText(text: string): Promise<void> {
  const generation = draftGeneration;
  const replyId = replyTo.value?.id;
  try {
    const result = await chatStore.sendMessage(text, replyId);
    if (generation !== draftGeneration || !result) return;
    if (draftText.value.trim() === text) {
      draftText.value = '';
    }
    if (replyTo.value?.id === replyId) replyTo.value = null;
    await scrollToBottom();
  } catch {
    if (generation === draftGeneration)
      notify('negative', t('manager.chat.notifications.messageError'));
  }
}

/** Сохраняет файл и reply при ошибке отправки для явного повтора. */
async function sendFile(file: File): Promise<void> {
  const generation = draftGeneration;
  const replyId = replyTo.value?.id;
  try {
    const result = await chatStore.sendAttachment(file, { replyToMessageId: replyId });
    if (generation !== draftGeneration || !result) return;
    pendingFile.value = null;
    fileDialog.value = false;
    if (replyTo.value?.id === replyId) replyTo.value = null;
    await scrollToBottom();
  } catch {
    if (generation === draftGeneration)
      notify('negative', t('manager.chat.notifications.attachmentError'));
  }
}

/** Передаёт запись с явным Telegram типом и очищает preview только после sent. */
async function sendRecording(file: File, kind: 'voice' | 'video_note'): Promise<void> {
  const generation = draftGeneration;
  const replyId = replyTo.value?.id;
  try {
    const result = await chatStore.sendAttachment(file, { kind, replyToMessageId: replyId });
    if (generation !== draftGeneration || !result) return;
    composer.value?.resetRecording();
    if (replyTo.value?.id === replyId) replyTo.value = null;
    await scrollToBottom();
  } catch {
    if (generation === draftGeneration)
      notify('negative', t('manager.chat.notifications.recordingError'));
  }
}

async function scrollToBottom(): Promise<void> {
  await nextTick();
  window.scrollTo({
    top: document.documentElement.scrollHeight,
    behavior: managerScrollBehavior(reducedMotionQuery?.matches ?? false),
  });
}

function goBack(): void {
  void router.push({ name: 'managerChats' });
}
</script>
