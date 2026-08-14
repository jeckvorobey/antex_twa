<template>
  <nav class="manager-bottom-nav" aria-label="Навигация менеджера">
    <div class="manager-bottom-nav__shell">
      <q-btn
        v-for="item in items"
        :key="item.name"
        flat
        stack
        rounded
        no-caps
        :icon="item.icon"
        :label="item.label"
        class="manager-bottom-nav__item"
        :class="{ 'manager-bottom-nav__item--active': isActive(item.name) }"
        @click="navigate(item.name)"
      >
        <q-badge
          v-if="item.name === 'managerChats' && chatStore.unreadTotal > 0"
          rounded
          floating
          class="manager-bottom-nav__badge"
          :label="chatStore.unreadTotal > 99 ? '99+' : chatStore.unreadTotal"
        />
      </q-btn>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';

import { useManagerChatStore } from '@stores/manager-chat.store';

const route = useRoute();
const router = useRouter();
const chatStore = useManagerChatStore();

const items = [
  { name: 'managerChats', label: 'Чаты', icon: 'chat_bubble_outline' },
  { name: 'managerOrders', label: 'Заявки', icon: 'receipt_long' },
  { name: 'managerProfile', label: 'Профиль', icon: 'person_outline' },
] as const;

function isActive(name: (typeof items)[number]['name']): boolean {
  if (name === 'managerChats') {
    return route.name === 'managerChats' || route.name === 'managerChat';
  }
  if (name === 'managerOrders') {
    return route.name === 'managerOrders' || route.name === 'managerOrder';
  }
  return route.name === name;
}

function navigate(name: (typeof items)[number]['name']): void {
  if (!isActive(name)) {
    void router.push({ name });
  }
}
</script>
