<template>
  <div
    class="app-bottom-nav fixed-bottom row justify-center q-px-sm q-pb-sm z-top"
    style="margin-bottom: env(safe-area-inset-bottom)"
  >
    <q-card
      flat
      bordered
      class="app-bottom-nav__shell bottom-nav__shell row no-wrap full-width q-pa-xs"
      style="max-width: 322px"
    >
      <q-btn
        v-for="(item, index) in items"
        :key="item.name"
        flat
        dense
        stack
        rounded
        no-caps
        class="app-bottom-nav__item col q-py-sm"
        size="10px"
        :icon="item.icon"
        :label="item.label"
        :text-color="isActive(item.name) ? 'primary' : 'white'"
        :class="{ 'bottom-nav__item--active': isActive(item.name) }"
        :style="{ '--bottom-nav-item-delay': `${index * 60}ms` }"
        :aria-label="item.label"
        :aria-current="isActive(item.name) ? 'page' : undefined"
        @click="navigateTo(item.name)"
      />
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

interface NavigationItem {
  name: string;
  icon: string;
  label: string;
}

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const items = computed<NavigationItem[]>(() => [
  {
    name: 'home',
    icon: 'home',
    label: t('nav.home'),
  },
  {
    name: 'exchange',
    icon: 'currency_exchange',
    label: t('nav.exchange'),
  },
  {
    name: 'history',
    icon: 'history',
    label: t('nav.history'),
  },
  {
    name: 'profile',
    icon: 'person_outline',
    label: t('nav.profile'),
  },
]);

function isActive(name: string): boolean {
  return route.name === name;
}

function navigateTo(name: string): void {
  if (route.name === name) {
    return;
  }

  void router.push({ name });
}
</script>
