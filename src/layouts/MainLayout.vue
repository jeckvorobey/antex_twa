<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="bg-transparent text-white">
      <AppHeaderBar :title="currentTitle" />
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

    <AppBottomNav />

    <OrderFormSheet v-model="uiStore.orderSheetOpen" />
    <MoreMenuSheet v-model="uiStore.moreSheetOpen" />
  </q-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

import MoreMenuSheet from '@components/orders/MoreMenuSheet.vue';
import OrderFormSheet from '@components/orders/OrderFormSheet.vue';
import AppBottomNav from '@components/ui/AppBottomNav.vue';
import AppHeaderBar from '@components/ui/AppHeaderBar.vue';
import { useUiStore } from '@stores/ui.store';

const route = useRoute();
const { t } = useI18n();
const uiStore = useUiStore();

const currentTitle = computed(() => {
  const key = (route.meta.title as string | undefined) ?? 'common.brand';
  return t(key);
});
</script>
