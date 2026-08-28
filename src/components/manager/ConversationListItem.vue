<template>
  <button
    type="button"
    class="manager-conversation-item"
    @click="$emit('open')"
  >
    <div class="manager-conversation-item__avatar">
      <img v-if="safePhotoUrl" :src="safePhotoUrl" alt="" />
      <span v-else>{{ initials }}</span>
    </div>
    <div class="manager-conversation-item__body">
      <div class="manager-conversation-item__row">
        <strong class="manager-conversation-item__order">{{ primaryId }}</strong>
        <span class="manager-conversation-item__time">{{ relativeTime }}</span>
      </div>
      <div class="manager-conversation-item__name">{{ displayName }}</div>
      <div class="manager-conversation-item__row manager-conversation-item__row--preview">
        <span class="manager-conversation-item__preview">{{ preview }}</span>
        <UnreadBadge :count="conversation.unreadCount" />
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import UnreadBadge from '@components/manager/UnreadBadge.vue';
import type { ManagerConversation } from '@types/manager-chat';
import {
  managerMessagePreview,
  managerRelativeTime,
  managerUserDisplayName,
  managerUserInitials,
} from '@utils/manager-chat';
import { toSafeExternalUrl } from '@utils/safe-external-url';

const props = defineProps<{ conversation: ManagerConversation }>();
defineEmits<{ open: [] }>();
const { locale, t } = useI18n();

const safePhotoUrl = computed(() => toSafeExternalUrl(props.conversation.user.photoUrl));
const displayName = computed(() =>
  managerUserDisplayName(
    props.conversation.user,
    t('manager.customerFallback', { id: props.conversation.user.id }),
  ),
);
const initials = computed(() => managerUserInitials(props.conversation.user));
const primaryId = computed(() =>
  props.conversation.latestOrder
    ? `#${props.conversation.latestOrder.publicNumber}`
    : t('manager.chats.conversationFallback', { id: props.conversation.id }),
);
const preview = computed(() => managerMessagePreview(props.conversation.lastMessage, t));
const relativeTime = computed(() =>
  managerRelativeTime(props.conversation.lastMessageAt, t, locale.value),
);
</script>
