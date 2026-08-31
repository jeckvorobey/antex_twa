<template>
  <q-page class="manager-page manager-chats">
    <AppHeaderBar
      :eyebrow="t('manager.role')"
      profile-route-name="managerProfile"
    />

    <div class="manager-chat-toolbar">
      <ManagerChatSearch
        v-model="chatStore.query"
        :placeholder="t('manager.chats.searchPlaceholder')"
        @search="reload"
      />
      <ManagerChatFilters
        :unread-only="chatStore.unreadOnly"
        :all-label="t('manager.chats.filters.all')"
        :unread-label="t('manager.chats.filters.unread')"
        :aria-label="t('manager.chats.filters.ariaLabel')"
        @change="setUnreadOnly"
      />
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
    <ManagerConversationList
      v-else
      :conversations="chatStore.conversations"
      @open="openConversation"
    />
  </q-page>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import ManagerChatFilters from '@components/manager/ManagerChatFilters.vue';
import ManagerChatSearch from '@components/manager/ManagerChatSearch.vue';
import ManagerConversationList from '@components/manager/ManagerConversationList.vue';
import AntexEmptyState from '@components/ui/AntexEmptyState.vue';
import AppHeaderBar from '@components/ui/AppHeaderBar.vue';
import { useManagerChatStore } from '@stores/manager-chat.store';

const router = useRouter();
const chatStore = useManagerChatStore();
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
