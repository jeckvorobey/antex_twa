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
      >
        <q-badge
          v-if="resolveBadge(item)"
          rounded
          floating
          class="app-bottom-nav__badge"
          :label="resolveBadge(item)"
        />
      </q-btn>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import { DEFAULT_USER_NAVIGATION, useAuthStore } from '@stores/auth.store';
import { useManagerChatStore } from '@stores/manager-chat.store';
import type { MiniappNavigationItem } from '@types/miniapp';

export type NavigationItem = MiniappNavigationItem;

export interface Props {
  items?: NavigationItem[];
}

const props = defineProps<Props>();

const route = useRoute();
const router = useRouter();
const { t, te } = useI18n();
const authStore = useAuthStore();
const chatStore = useManagerChatStore();

const defaultNavItems: NavigationItem[] = DEFAULT_USER_NAVIGATION ?? [
  { name: 'home', icon: 'home', label: 'Главная', route: 'home' },
  { name: 'exchange', icon: 'currency_exchange', label: 'Обмен', route: 'exchange' },
  { name: 'history', icon: 'history', label: 'История', route: 'history' },
  { name: 'profile', icon: 'person_outline', label: 'Профиль', route: 'profile' },
];

const items = computed<NavigationItem[]>(() => {
  const source = props.items?.length
    ? props.items
    : authStore.navigation?.length
      ? authStore.navigation
      : defaultNavItems;

  return source.map((item) => {
    const i18nKey = `nav.${item.name}`;
    const localizedLabel = te(i18nKey) ? t(i18nKey) : item.label;
    return {
      ...item,
      label: localizedLabel,
    };
  });
});

function isActive(name: string): boolean {
  if (route.name === name) {
    return true;
  }
  if (name === 'managerChats' && route.name === 'managerChat') {
    return true;
  }
  if (name === 'managerOrders' && route.name === 'managerOrder') {
    return true;
  }
  return false;
}

function resolveBadge(item: NavigationItem): string | number | null {
  if (
    item.badge_key === 'unread_chats' ||
    item.badge_key === 'manager_chats_unread' ||
    item.name === 'managerChats'
  ) {
    if (chatStore.unreadTotal > 0) {
      return chatStore.unreadTotal > 99 ? '99+' : chatStore.unreadTotal;
    }
  }
  return null;
}

function navigateTo(name: string): void {
  if (route.name === name || isActive(name)) {
    return;
  }

  void router.push({ name });
}
</script>
