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
  if (!chatStore.chatsLoaded) {
    void chatStore.loadChats();
  }
  if (!chatStore.orders.length) {
    void chatStore.loadOrders();
  }
});

onBeforeUnmount(() => {
  realtimeStore.stop();
  realtimeStore.setViewing(null);
});
</script>

<style src="../css/manager.scss" lang="scss"></style>
