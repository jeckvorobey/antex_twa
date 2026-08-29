<template>
  <div class="manager-chat-bubble-row" :class="`manager-chat-bubble-row--${message.direction}`">
    <article class="manager-chat-bubble" :class="`manager-chat-bubble--${message.direction}`">
      <ChatAttachmentCard
        v-for="attachment in message.attachments"
        :key="attachment.id"
        :attachment="attachment"
      />
      <div v-if="content" class="manager-chat-bubble__text">{{ content }}</div>
      <div class="manager-chat-bubble__footer">
        <span v-if="message.edited">{{ t('manager.chat.message.edited') }}</span>
        <span>{{ time }}</span>
        <span
          v-if="message.direction === 'outbound'"
          class="manager-chat-bubble__delivery"
          :role="deliveryStatusLabel ? 'status' : undefined"
          :aria-label="deliveryStatusLabel || undefined"
        >
          <q-icon v-if="message.deliveryStatus === 'failed'" name="error_outline" size="14px" />
          <q-icon v-else-if="message.deliveryStatus === 'sent'" name="done" size="14px" />
          <q-spinner-dots
            v-else-if="message.deliveryStatus === 'pending'"
            size="14px"
            aria-hidden="true"
          />
        </span>
      </div>
      <div
        v-if="message.deliveryStatus === 'failed'"
        class="manager-chat-bubble__failed"
        aria-hidden="true"
      >
        {{ t('manager.chat.message.failed') }}
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import ChatAttachmentCard from '@components/manager/ChatAttachmentCard.vue';
import type { ManagerChatMessage } from '@types/manager-chat';

const props = defineProps<{ message: ManagerChatMessage }>();
const { locale, t } = useI18n();

const content = computed(() => props.message.text || props.message.caption);
const deliveryStatusLabel = computed(() => {
  if (props.message.deliveryStatus === 'pending') {
    return t('manager.chat.message.pending');
  }
  if (props.message.deliveryStatus === 'sent') {
    return t('manager.chat.message.sent');
  }
  if (props.message.deliveryStatus === 'failed') {
    return t('manager.chat.message.failed');
  }
  return '';
});
const time = computed(() =>
  new Intl.DateTimeFormat(locale.value, { hour: '2-digit', minute: '2-digit' }).format(
    Date.parse(props.message.createdAt),
  ),
);
</script>
