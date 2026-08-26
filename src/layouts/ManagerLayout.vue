<template>
  <q-layout view="hHh Lpr lFf" class="manager-layout">
    <q-header class="manager-mobile-header lt-md">
      <q-toolbar>
        <q-btn
          ref="menuButtonRef"
          flat
          round
          dense
          icon="menu"
          :aria-label="t('manager.navigation.open')"
          :aria-expanded="drawerOpen"
          aria-controls="manager-navigation-drawer"
          @click="drawerOpen = !drawerOpen"
        />
        <q-toolbar-title class="manager-mobile-header__title">
          {{ t('manager.navigation.title') }}
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer
      id="manager-navigation-drawer"
      v-model="drawerOpen"
      show-if-above
      :breakpoint="1023"
      :width="280"
      class="manager-navigation-drawer"
      :aria-label="t('manager.navigation.label')"
      @show="focusNavigation"
      @hide="restoreMenuFocus"
    >
      <ManagerNavigation ref="navigationRef" @navigate="closeMobileDrawer" />
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import ManagerNavigation from '@components/manager/ManagerNavigation.vue';
import { useManagerChatStore } from '@stores/manager-chat.store';
import { useManagerRealtimeStore } from '@stores/manager-realtime.store';

const chatStore = useManagerChatStore();
const realtimeStore = useManagerRealtimeStore();
const $q = useQuasar();
const { t } = useI18n();
const drawerOpen = ref(false);
const menuButtonRef = ref<{ $el?: HTMLElement } | null>(null);
const navigationRef = ref<{ focusFirst: () => void } | null>(null);

function closeMobileDrawer(): void {
  if ($q.screen.lt.md) {
    drawerOpen.value = false;
  }
}

async function focusNavigation(): Promise<void> {
  if (!$q.screen.lt.md) return;
  await nextTick();
  navigationRef.value?.focusFirst();
}

async function restoreMenuFocus(): Promise<void> {
  if (!$q.screen.lt.md) return;
  await nextTick();
  menuButtonRef.value?.$el?.focus();
}

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
