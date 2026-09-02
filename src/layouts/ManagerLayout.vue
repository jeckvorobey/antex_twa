<template>
  <q-layout view="lHh Lpr lFf" class="app-layout manager-layout">
    <AppLayoutBackground />
    <q-page-container>
      <router-view :key="`${authStore.user?.id}:${authStore.user?.role}`" />
    </q-page-container>
    <AntexBottomNav />
  </q-layout>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue';

import AntexBottomNav from '@components/ui/AntexBottomNav.vue';
import AppLayoutBackground from '@components/ui/AppLayoutBackground.vue';
import { useManagerChatStore } from '@stores/manager-chat.store';
import { useManagerRealtimeStore } from '@stores/manager-realtime.store';
import { useAuthStore } from '@stores/auth.store';
import { isManagerRole } from '@utils/manager-workspace';

const chatStore = useManagerChatStore();
const realtimeStore = useManagerRealtimeStore();
const authStore = useAuthStore();

// Смена пользователя/роли очищает чаты синхронно, до отрисовки нового workspace.
watch(
  [() => authStore.user?.id, () => authStore.user?.role],
  () => {
    realtimeStore.stop();
    realtimeStore.setViewing(null);
    chatStore.resetSession();
    if (isManagerRole(authStore.user?.role)) {
      realtimeStore.start();
      void chatStore.loadChats().catch(() => undefined);
      void chatStore.loadOrders().catch(() => undefined);
    }
  },
  { flush: 'sync' },
);

onMounted(() => {
  document.body.classList.add('manager-workspace-active');
  realtimeStore.start();
  if (!chatStore.chatsLoaded && !chatStore.loadingChats) {
    void chatStore.loadChats().catch(() => undefined);
  }
  if (!chatStore.orders.length && !chatStore.ordersLoading) {
    void chatStore.loadOrders().catch(() => undefined);
  }
});

onBeforeUnmount(() => {
  document.body.classList.remove('manager-workspace-active');
  realtimeStore.stop();
  realtimeStore.setViewing(null);
  chatStore.resetSession();
});
</script>

<style src="../css/manager.scss" lang="scss"></style>
