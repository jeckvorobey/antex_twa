<template>
  <q-layout view="lHh Lpr lFf" class="manager-layout">
    <q-page-container>
      <router-view />
    </q-page-container>
    <AppBottomNav />
  </q-layout>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue';

import AppBottomNav from '@components/ui/AppBottomNav.vue';
import { useManagerChatStore } from '@stores/manager-chat.store';
import { useManagerRealtimeStore } from '@stores/manager-realtime.store';

const chatStore = useManagerChatStore();
const realtimeStore = useManagerRealtimeStore();

onMounted(() => {
  realtimeStore.start();
  if (!chatStore.chatsLoaded && !chatStore.loadingChats) {
    void chatStore.loadChats().catch(() => undefined);
  }
  if (!chatStore.orders.length && !chatStore.ordersLoading) {
    void chatStore.loadOrders().catch(() => undefined);
  }
});

onBeforeUnmount(() => {
  realtimeStore.stop();
  realtimeStore.setViewing(null);
});
</script>

<style src="../css/manager.scss" lang="scss"></style>
