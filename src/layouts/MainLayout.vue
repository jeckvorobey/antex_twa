<template>
  <q-layout class="app-layout" view="lHh Lpr lFf">
    <div class="app-layout-background" aria-hidden="true">
      <div class="app-layout-background__mesh" />
      <div class="app-layout-background__glow app-layout-background__glow--top" />
      <div class="app-layout-background__glow app-layout-background__glow--bottom" />
      <div class="app-layout-background__grain" />
    </div>

    <q-page-container>
      <router-view />
    </q-page-container>

    <AppBottomNav />

    <OrderFormSheet v-model="uiStore.orderSheetOpen" />
    <MoreMenuSheet v-model="uiStore.moreSheetOpen" />
  </q-layout>
</template>

<script setup lang="ts">
import MoreMenuSheet from '@components/orders/MoreMenuSheet.vue';
import OrderFormSheet from '@components/orders/OrderFormSheet.vue';
import AppBottomNav from '@components/ui/AppBottomNav.vue';
import { useUiStore } from '@stores/ui.store';

const uiStore = useUiStore();
</script>
