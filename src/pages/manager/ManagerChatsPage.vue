<template>
  <q-page class="manager-page">
    <ManagerPageHeader
      title="Чаты"
      :subtitle="
        chatStore.unreadTotal ? `Непрочитанных: ${chatStore.unreadTotal}` : 'Все обращения клиентов'
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
        placeholder="Поиск по имени или @username"
        class="manager-search-input q-px-md"
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
          Все
        </button>
        <button
          type="button"
          class="manager-filter-pill"
          :class="{ 'manager-filter-pill--active': chatStore.unreadOnly }"
          @click="setUnreadOnly(true)"
        >
          Непрочитанные
        </button>
      </div>
    </div>

    <div v-if="chatStore.loadingChats && !chatStore.chatsLoaded" class="row justify-center q-py-xl">
      <q-spinner size="36px" color="primary" />
    </div>
    <EmptyStateCard
      v-else-if="!chatStore.conversations.length"
      title="Новых диалогов нет"
      :text="
        chatStore.unreadOnly
          ? 'Все сообщения уже прочитаны.'
          : 'Новый клиент появится здесь сразу после сообщения боту.'
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
import { useRouter } from 'vue-router';

import ConnectionStatePill from '@components/manager/ConnectionStatePill.vue';
import ConversationListItem from '@components/manager/ConversationListItem.vue';
import EmptyStateCard from '@components/manager/EmptyStateCard.vue';
import ManagerPageHeader from '@components/manager/ManagerPageHeader.vue';
import { useManagerChatStore } from '@stores/manager-chat.store';
import { useManagerRealtimeStore } from '@stores/manager-realtime.store';

const router = useRouter();
const chatStore = useManagerChatStore();
const realtimeStore = useManagerRealtimeStore();

onMounted(() => {
  void chatStore.loadChats();
});

onBeforeUnmount(() => {
  chatStore.cancelChatsLoad();
});

function reload(): void {
  void chatStore.loadChats();
}

function setUnreadOnly(value: boolean): void {
  if (chatStore.unreadOnly === value) {
    return;
  }
  chatStore.unreadOnly = value;
  void chatStore.loadChats();
}

function openConversation(conversationId: number): void {
  void router.push({ name: 'managerChat', params: { conversationId } });
}
</script>
