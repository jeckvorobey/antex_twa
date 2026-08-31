<template>
  <q-layout class="app-layout" view="lHh Lpr lFf">
    <AppLayoutBackground />

    <div class="app-header-shell">
      <AppHeaderBar />
    </div>

    <q-page-container>
      <router-view />
    </q-page-container>

    <AntexBottomNav v-if="shouldShowNavigation" />

    <AppPageLoader :showing="pageLoading" @hidden="showNavigation" />

    <OrderFormSheet v-model="uiStore.orderSheetOpen" />
    <MoreMenuSheet v-model="uiStore.moreSheetOpen" />
  </q-layout>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import MoreMenuSheet from '@components/orders/MoreMenuSheet.vue';
import OrderFormSheet from '@components/orders/OrderFormSheet.vue';
import AntexBottomNav from '@components/ui/AntexBottomNav.vue';
import AppHeaderBar from '@components/ui/AppHeaderBar.vue';
import AppLayoutBackground from '@components/ui/AppLayoutBackground.vue';
import AppPageLoader from '@components/ui/AppPageLoader.vue';
import { useExchangeStore } from '@stores/exchange.store';
import { useHomeStore } from '@stores/home.store';
import { useOrdersStore } from '@stores/orders.store';
import { useProfileStore } from '@stores/profile.store';
import { useUiStore } from '@stores/ui.store';

const route = useRoute();
const homeStore = useHomeStore();
const exchangeStore = useExchangeStore();
const ordersStore = useOrdersStore();
const profileStore = useProfileStore();
const uiStore = useUiStore();

const pageLoading = computed(() => {
  switch (route.name) {
    case 'home':
      return homeStore.loading || !homeStore.loaded;
    case 'exchange':
      return exchangeStore.loading || !exchangeStore.loaded;
    case 'history':
      return ordersStore.loading || !ordersStore.loaded;
    case 'profile':
      return profileStore.loading || !profileStore.loaded;
    default:
      return false;
  }
});

const navigationVisible = ref(!pageLoading.value);
const shouldShowNavigation = computed(
  () => navigationVisible.value && !uiStore.orderSheetOpen && !uiStore.moreSheetOpen,
);

watch(pageLoading, (loading) => {
  if (loading) {
    navigationVisible.value = false;
  }
});

function showNavigation(): void {
  if (!pageLoading.value) {
    navigationVisible.value = true;
  }
}
</script>
