<template>
  <q-page class="manager-page">
    <ManagerPageHeader
      :title="t('manager.chats.title')"
      :subtitle="
        chatStore.unreadTotal
          ? t('manager.chats.unreadSummary', { count: chatStore.unreadTotal })
          : t('manager.chats.subtitle')
      "
    >
      <template #trailing>
        <ConnectionStatePill :state="realtimeStore.state" />
      </template>
    </ManagerPageHeader>

    <div class="manager-chat-toolbar">
      <q-input
        v-model="chatStore.query"
        borderless
        dense
        :debounce="250"
        :placeholder="t('manager.chats.searchPlaceholder')"
        class="manager-search-input antex-border-gold--muted q-px-md"
        @update:model-value="reload"
      >
        <template #prepend><q-icon name="search" size="20px" /></template>
      </q-input>
      <div class="manager-chat-filters">
        <button
          type="button"
          class="manager-filter-pill"
          :class="{ 'manager-filter-pill--active': !chatStore.unreadOnly }"
          @click="setUnreadOnly(false)"
        >
          {{ t('manager.chats.filters.all') }}
        </button>
        <button
          type="button"
          class="manager-filter-pill"
          :class="{ 'manager-filter-pill--active': chatStore.unreadOnly }"
          @click="setUnreadOnly(true)"
        >
          {{ t('manager.chats.filters.unread') }}
        </button>
      </div>
    </div>

    <div v-if="chatStore.loadingChats && !chatStore.chatsLoaded" class="row justify-center q-py-xl">
      <q-spinner size="36px" color="primary" />
    </div>
    <AntexEmptyState
      v-else-if="chatStore.chatsError"
      :title="t('manager.chats.error.title')"
      :description="t('manager.chats.error.text')"
      :action-label="t('common.retry')"
      icon="cloud_off"
      @action="loadChats"
    />
    <AntexEmptyState
      v-else-if="!chatStore.conversations.length"
      :title="t('manager.chats.empty.title')"
      :description="
        chatStore.unreadOnly
          ? t('manager.chats.empty.unreadText')
          : t('manager.chats.empty.text')
      "
      icon="forum"
    />
    <div v-else class="manager-conversation-list">
      <ConversationListItem
        v-for="conversation in chatStore.conversations"
        :key="conversation.id"
        :conversation="conversation"
        @open="openConversation(conversation.id)"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import ConnectionStatePill from '@components/manager/ConnectionStatePill.vue';
import ConversationListItem from '@components/manager/ConversationListItem.vue';
import AntexEmptyState from '@components/ui/AntexEmptyState.vue';
import ManagerPageHeader from '@components/manager/ManagerPageHeader.vue';
import { useManagerChatStore } from '@stores/manager-chat.store';
import { useManagerRealtimeStore } from '@stores/manager-realtime.store';

const router = useRouter();
const chatStore = useManagerChatStore();
const realtimeStore = useManagerRealtimeStore();
const { t } = useI18n();

onMounted(() => {
  void loadChats();
});

onBeforeUnmount(() => {
  chatStore.cancelChatsLoad();
});

function reload(): void {
  void loadChats();
}

function setUnreadOnly(value: boolean): void {
  if (chatStore.unreadOnly === value) {
    return;
  }
  chatStore.unreadOnly = value;
  void loadChats();
}

async function loadChats(): Promise<void> {
  try {
    await chatStore.loadChats();
  } catch {
    // Ошибка представлена отдельным retryable state из store.
  }
}

function openConversation(conversationId: number): void {
  void router.push({ name: 'managerChat', params: { conversationId } });
}
</script>
