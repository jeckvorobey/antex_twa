<template>
  <q-layout view="lHh Lpr lFf" class="app-layout manager-layout">
    <AppLayoutBackground />
    <q-page-container>
      <router-view />
    </q-page-container>
    <AntexBottomNav />
  </q-layout>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue';

import AntexBottomNav from '@components/ui/AntexBottomNav.vue';
import AppLayoutBackground from '@components/ui/AppLayoutBackground.vue';
import { useManagerChatStore } from '@stores/manager-chat.store';
import { useManagerRealtimeStore } from '@stores/manager-realtime.store';

const chatStore = useManagerChatStore();
const realtimeStore = useManagerRealtimeStore();

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
});
</script>

<style src="../css/manager.scss" lang="scss"></style>
