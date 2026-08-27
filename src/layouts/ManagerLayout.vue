<template>
  <q-layout
    view="lHh Lpr lFf"
    :class="[
      'app-layout',
      'manager-layout',
      { 'manager-layout--dashboard': route.name === 'managerDashboard' },
    ]"
  >
    <AppLayoutBackground />
    <q-page-container>
      <router-view />
    </q-page-container>
    <AntexBottomNav />
  </q-layout>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue';
import { useRoute } from 'vue-router';

import AntexBottomNav from '@components/ui/AntexBottomNav.vue';
import AppLayoutBackground from '@components/ui/AppLayoutBackground.vue';
import { useManagerChatStore } from '@stores/manager-chat.store';
import { useManagerRealtimeStore } from '@stores/manager-realtime.store';

const chatStore = useManagerChatStore();
const realtimeStore = useManagerRealtimeStore();
const route = useRoute();

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
