<template>
  <q-footer class="bottom-nav bg-transparent text-white">
    <div class="bottom-nav__safe-area row justify-center q-px-sm">
      <q-card
        flat
        bordered
        class="bottom-nav__shell row no-wrap full-width q-pa-xs"
        style="max-width: 308px"
      >
        <q-btn
          v-for="item in items"
          :key="item.name"
          flat
          dense
          stack
          rounded
          no-caps
          class="col"
          size="sm"
          :text-color="isActive(item.name) ? 'primary' : 'white'"
          :class="{ 'bottom-nav__item--active': isActive(item.name) }"
          :aria-label="item.label"
          :aria-current="isActive(item.name) ? 'page' : undefined"
          @click="navigateTo(item.name)"
        >
          <q-avatar v-if="item.name === 'profile'" size="24px">
            <q-img
              v-if="userPhotoUrl"
              :src="userPhotoUrl"
              fit="cover"
              width="100%"
              height="100%"
              :alt="item.label"
              no-spinner
            />
            <span v-else class="text-caption text-weight-bold">{{ userInitials }}</span>
          </q-avatar>
          <q-icon v-else :name="item.icon" size="24px" />
          <span class="text-caption text-weight-medium">{{ item.label }}</span>
        </q-btn>
      </q-card>
    </div>
  </q-footer>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import { useAuthStore } from '@stores/auth.store';
import { toSafeExternalUrl } from '@utils/safe-external-url';
import { getTelegramUserInitials } from '@utils/telegram';

interface NavigationItem {
  name: string;
  icon: string;
  label: string;
}

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { t } = useI18n();

const userPhotoUrl = computed(() => toSafeExternalUrl(authStore.user?.photo_url));
const userInitials = computed(() => getTelegramUserInitials(authStore.user));

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

/** Проверяет, соответствует ли action текущему route. */
function isActive(name: string): boolean {
  return route.name === name;
}

/** Переходит к route, пропуская повторное нажатие активного action. */
function navigateTo(name: string): void {
  if (route.name === name) {
    return;
  }

  void router.push({ name });
}
</script>

<style scoped lang="scss">
.bottom-nav__safe-area {
  padding-bottom: var(--antex-safe-area-bottom);
}

.bottom-nav__shell {
  overflow: hidden;
  border-color: rgba(242, 210, 122, 0.18);
  border-radius: 36px;
  background:
    linear-gradient(180deg, rgba(28, 73, 65, 0.75), rgba(10, 31, 28, 0.65)), rgba(18, 53, 48, 0.36);
  box-shadow:
    0 18px 42px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
}

.bottom-nav__item--active {
  background: rgba(212, 175, 55, 0.14);
}
</style>
