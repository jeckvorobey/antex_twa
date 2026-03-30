<template>
  <div class="app-bottom-nav">
    <div class="app-bottom-nav__shell">
      <q-btn
        v-for="item in items"
        :key="item.name"
        flat
        stack
        no-caps
        :icon="item.icon"
        :label="item.label"
        :class="['app-bottom-nav__item', isActive(item.name) ? 'app-bottom-nav__item--active' : null]"
        @click="handleClick(item)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import { useUiStore } from '@stores/ui.store';

const router = useRouter();
const route = useRoute();
const uiStore = useUiStore();
const { t } = useI18n();

const items = [
  { name: 'home', icon: 'home', label: t('nav.home') },
  { name: 'exchange', icon: 'currency_exchange', label: t('nav.exchange') },
  { name: 'history', icon: 'history', label: t('nav.history') },
  { name: 'profile', icon: 'person_outline', label: t('nav.profile') },
  { name: 'more', icon: 'more_horiz', label: t('nav.more') },
];

function isActive(name: string) {
  return route.name === name;
}

function handleClick(item: { name: string }) {
  if (item.name === 'more') {
    uiStore.openMoreSheet();
    return;
  }

  void router.push({ name: item.name });
}
</script>
