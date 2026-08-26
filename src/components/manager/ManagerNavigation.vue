<template>
  <nav ref="navigationRoot" class="manager-navigation" :aria-label="t('manager.navigation.label')">
    <div class="manager-navigation__brand q-px-md q-py-lg">
      <span class="manager-navigation__brand-mark">AntEx</span>
      <span class="manager-navigation__brand-role">{{ t('manager.navigation.title') }}</span>
    </div>
    <q-list role="none" class="q-px-sm">
      <ManagerNavigationItem
        v-for="item in items"
        :key="item.name"
        :item="item"
        :active="isActive(item)"
        :badge="resolveBadge(item)"
        @select="navigateTo(item)"
      />
    </q-list>
  </nav>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import ManagerNavigationItem from '@components/manager/ManagerNavigationItem.vue';
import { useAuthStore } from '@stores/auth.store';
import { useManagerChatStore } from '@stores/manager-chat.store';
import type { MiniappNavigationItem } from '@types/miniapp';

const emit = defineEmits<{
  navigate: [];
}>();
const authStore = useAuthStore();
const chatStore = useManagerChatStore();
const route = useRoute();
const router = useRouter();
const { t, te } = useI18n();
const navigationRoot = ref<HTMLElement | null>(null);

const items = computed<MiniappNavigationItem[]>(() => {
  const managerItems = authStore.navigation.filter((item) => item.route?.startsWith('manager'));
  return managerItems.map((item) => {
    const key = `nav.${item.name}`;
    return { ...item, label: te(key) ? t(key) : item.label };
  });
});

function isActive(item: MiniappNavigationItem): boolean {
  const routeName = String(route.name ?? '');
  if (routeName === item.route) return true;
  if (item.name === 'managerChats' && routeName === 'managerChat') return true;
  if (item.name === 'managerOrders' && routeName === 'managerOrder') return true;
  return false;
}

function resolveBadge(item: MiniappNavigationItem): string | number | null {
  const isChatBadge =
    item.badge_key === 'unread_chats' ||
    item.badge_key === 'manager_chats_unread' ||
    item.name === 'managerChats';
  if (!isChatBadge || chatStore.unreadTotal <= 0) return null;
  return chatStore.unreadTotal > 99 ? '99+' : chatStore.unreadTotal;
}

function navigateTo(item: MiniappNavigationItem): void {
  if (!isActive(item) && item.route) {
    void router.push({ name: item.route });
  }
  emit('navigate');
}

function focusFirst(): void {
  navigationRoot.value?.querySelector<HTMLElement>('.manager-navigation-item')?.focus();
}

defineExpose({ focusFirst });
</script>
