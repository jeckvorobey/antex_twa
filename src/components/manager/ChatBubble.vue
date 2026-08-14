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
        <span v-if="message.edited">изменено</span>
        <span>{{ time }}</span>
        <span v-if="message.direction === 'outbound'" class="manager-chat-bubble__delivery">
          <q-icon v-if="message.deliveryStatus === 'failed'" name="error_outline" size="14px" />
          <q-icon v-else-if="message.deliveryStatus === 'sent'" name="done" size="14px" />
          <q-spinner-dots v-else-if="message.deliveryStatus === 'pending'" size="14px" />
        </span>
      </div>
      <div v-if="message.deliveryStatus === 'failed'" class="manager-chat-bubble__failed">
        Не доставлено
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import ChatAttachmentCard from '@components/manager/ChatAttachmentCard.vue';
import type { ManagerChatMessage } from '@types/manager-chat';

const props = defineProps<{ message: ManagerChatMessage }>();

const content = computed(() => props.message.text || props.message.caption);
const time = computed(() =>
  new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(
    Date.parse(props.message.createdAt),
  ),
);
</script>
