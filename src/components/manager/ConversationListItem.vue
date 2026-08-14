<template>
  <button type="button" class="manager-conversation-item" @click="$emit('open')">
    <div class="manager-conversation-item__avatar">
      <img v-if="conversation.user.photoUrl" :src="conversation.user.photoUrl" alt="" />
      <span v-else>{{ initials }}</span>
    </div>
    <div class="manager-conversation-item__body">
      <div class="manager-conversation-item__row">
        <strong class="manager-conversation-item__name">{{ displayName }}</strong>
        <span class="manager-conversation-item__time">{{ relativeTime }}</span>
      </div>
      <div class="manager-conversation-item__row manager-conversation-item__row--preview">
        <span class="manager-conversation-item__preview">{{ preview }}</span>
        <UnreadBadge :count="conversation.unreadCount" />
      </div>
      <div v-if="conversation.latestOrder" class="manager-conversation-item__order">
        #{{ conversation.latestOrder.publicNumber }} · {{ conversation.latestOrder.currencySell }} →
        {{ conversation.latestOrder.currencyBuy }}
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import UnreadBadge from '@components/manager/UnreadBadge.vue';
import type { ManagerConversation } from '@types/manager-chat';
import {
  managerMessagePreview,
  managerRelativeTime,
  managerUserDisplayName,
  managerUserInitials,
} from '@utils/manager-chat';

const props = defineProps<{ conversation: ManagerConversation }>();
defineEmits<{ open: [] }>();

const displayName = computed(() => managerUserDisplayName(props.conversation.user));
const initials = computed(() => managerUserInitials(props.conversation.user));
const preview = computed(() => managerMessagePreview(props.conversation.lastMessage));
const relativeTime = computed(() => managerRelativeTime(props.conversation.lastMessageAt));
</script>
