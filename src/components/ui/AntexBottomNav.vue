<template>
  <nav class="antex-bottom-nav app-bottom-nav fixed-bottom" :aria-label="t('nav.navigation')">
    <AntexCard
      :elevated="false"
      class="antex-bottom-nav__shell app-bottom-nav__shell bottom-nav__shell"
    >
      <q-btn
        v-for="(item, index) in items"
        :key="item.name"
        flat
        dense
        stack
        rounded
        no-caps
        class="antex-bottom-nav__item app-bottom-nav__item"
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
    </AntexCard>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import AntexCard from '@components/ui/AntexCard.vue';
import { useAuthStore } from '@stores/auth.store';
import { useManagerChatStore } from '@stores/manager-chat.store';
import type { MiniappNavigationItem } from '@types/miniapp';

export type NavigationItem = MiniappNavigationItem;
const props = defineProps<{ items?: NavigationItem[] }>();
const route = useRoute();
const router = useRouter();
const { t, te } = useI18n();
const authStore = useAuthStore();
const chatStore = useManagerChatStore();

const items = computed<NavigationItem[]>(() =>
  (props.items ?? authStore.navigation).map((item) => {
    const key = `nav.${item.name}`;
    return { ...item, label: te(key) ? t(key) : item.label };
  }),
);

function isActive(item: NavigationItem): boolean {
  if (route.name === item.route) return true;
  if (item.name === 'managerChats' && route.name === 'managerChat') return true;
  if (item.name === 'managerOrders' && route.name === 'managerOrder') return true;
  return false;
}

function resolveBadge(item: NavigationItem): string | number | null {
  const isChatBadge =
    item.badge_key === 'unread_chats' ||
    item.badge_key === 'manager_chats_unread' ||
    item.name === 'managerChats';
  if (!isChatBadge || chatStore.unreadTotal <= 0) return null;
  return chatStore.unreadTotal > 99 ? '99+' : chatStore.unreadTotal;
}

function navigateTo(item: NavigationItem): void {
  if (!isActive(item)) void router.push({ name: item.route });
}
</script>
