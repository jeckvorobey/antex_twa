<template>
  <div class="manager-conversation-list">
    <template v-for="(conversation, index) in conversations" :key="conversation.id">
      <ConversationListItem
        :conversation="conversation"
        @open="$emit('open', conversation.id)"
      />
      <q-separator v-if="index < conversations.length - 1" class="manager-conversation-separator" />
    </template>
  </div>
</template>

<script setup lang="ts">
import ConversationListItem from '@components/manager/ConversationListItem.vue';
import type { ManagerConversation } from '@types/manager-chat';

defineProps<{ conversations: ManagerConversation[] }>();
defineEmits<{ open: [conversationId: number] }>();
</script>
