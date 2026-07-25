<template>
  <div class="app-bottom-nav">
    <q-card flat bordered class="app-bottom-nav__shell row no-wrap q-pa-sm">
      <q-btn
        v-for="item in items"
        :key="item.name"
        flat
        dense
        stack
        no-caps
        size="sm"
        :icon="item.icon"
        :label="item.label"
        :text-color="isActive(item.name) ? 'primary' : 'white'"
        :class="[
          'app-bottom-nav__item col',
          isActive(item.name) ? 'app-bottom-nav__item--active' : null,
        ]"
        @click="handleClick(item)"
      />
    </q-card>
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

<style scoped lang="scss">
.app-bottom-nav {
  position: fixed;
  left: 50%;
  bottom: calc(env(safe-area-inset-bottom) + var(--antex-space-sm));
  width: calc(100vw - (var(--antex-space-lg) * 2));
  max-width: 344px;
  transform: translateX(-50%);
  z-index: 40;
}

.app-bottom-nav__shell {
  border-color: rgba(242, 210, 122, 0.18);
  border-radius: 36px;
  background:
    linear-gradient(180deg, rgba(28, 73, 65, 0.62), rgba(10, 31, 28, 0.48)), rgba(18, 53, 48, 0.46);
  box-shadow:
    0 18px 42px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 0 22px rgba(212, 175, 55, 0.08);
  backdrop-filter: blur(22px) saturate(145%);
  -webkit-backdrop-filter: blur(22px) saturate(145%);
}

.app-bottom-nav__item {
  min-width: 0;
  border-radius: 26px;
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    filter 0.2s ease;
}

.app-bottom-nav__item--active {
  background: rgba(212, 175, 55, 0.14);
  box-shadow:
    inset 0 0 0 1px rgba(242, 210, 122, 0.12),
    0 6px 14px rgba(0, 0, 0, 0.18);
}
</style>
