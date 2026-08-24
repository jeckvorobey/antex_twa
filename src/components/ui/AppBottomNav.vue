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
        :text-color="isActive(item) ? 'primary' : 'white'"
        :class="{ 'bottom-nav__item--active': isActive(item) }"
        :style="{ '--bottom-nav-item-delay': `${index * 60}ms` }"
        :aria-label="item.label"
        :aria-current="isActive(item) ? 'page' : undefined"
        @click="navigateTo(item)"
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

import { useAuthStore } from '@stores/auth.store';
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

const items = computed<NavigationItem[]>(() => {
  const source = props.items ?? authStore.navigation;

  return source.map((item) => {
    const i18nKey = `nav.${item.name}`;
    const localizedLabel = te(i18nKey) ? t(i18nKey) : item.label;
    return {
      ...item,
      label: localizedLabel,
    };
  });
});

/** Сопоставляет стабильный id пункта с его backend route и дочерними экранами. */
function isActive(item: NavigationItem): boolean {
  if (route.name === item.route) {
    return true;
  }
  if (item.name === 'managerChats' && route.name === 'managerChat') {
    return true;
  }
  if (item.name === 'managerOrders' && route.name === 'managerOrder') {
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

/** Переходит по route, переданному backend, не связывая компонент с ролью. */
function navigateTo(item: NavigationItem): void {
  if (isActive(item)) {
    return;
  }

  void router.push({ name: item.route });
}
</script>
