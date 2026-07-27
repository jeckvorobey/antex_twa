<template>
  <q-page class="app-page">
    <div class="app-screen app-screen--profile">
      <div class="app-profile-hero">
        <q-avatar class="app-profile-hero__avatar">
          <q-img
            v-if="profilePhotoUrl"
            :src="profilePhotoUrl"
            fit="cover"
            width="100%"
            height="100%"
            :alt="profileStore.data?.user.displayName ?? t('nav.profile')"
            no-spinner
          />
          <q-icon v-else name="person_outline" size="34px" />
        </q-avatar>
        <div class="app-profile-hero__name">{{ profileStore.data?.user.displayName }}</div>
        <div class="app-profile-hero__username">
          {{
            profileStore.data?.user.username
              ? `@${profileStore.data.user.username}`
              : t('common.brand')
          }}
        </div>
      </div>

      <AppSurface class="app-profile-card">
        <AppInfoRow
          icon="group_add"
          :title="t('profile.referralProgram')"
          clickable
          @click="goToReferral"
        />
      </AppSurface>

      <AppSurface
        v-if="profileStore.data?.managerAvailability && profileStore.data.managerAvailability.status !== 'unknown'"
        class="app-profile-card q-pa-md"
      >
        <div class="row no-wrap items-start q-gutter-sm">
          <q-icon name="support_agent" color="primary" size="22px" />
          <div class="col">
            <div class="text-subtitle2">{{ t('profile.managerHours') }}</div>
            <div class="text-body2 text-grey-5 q-mt-xs">
              {{ profileStore.data.managerAvailability.businessHoursText }}
            </div>
            <div class="text-body2 q-mt-sm">
              {{ managerStatusText }}
            </div>
            <div v-if="nextStartText" class="text-caption text-grey-5 q-mt-xs">
              {{ t('profile.nextStart', { time: nextStartText }) }}
            </div>
          </div>
        </div>
      </AppSurface>

      <AppSurface class="app-profile-card">
        <AppInfoRow
          v-for="item in profileStore.data?.menu ?? []"
          :key="item.id"
          :icon="item.icon"
          :title="item.title"
          clickable
          @click="handleMenu(item)"
        />
      </AppSurface>

      <div class="app-version-text">
        {{ t('profile.version', { version: profileStore.data?.version ?? '1.0.0' }) }}
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import AppInfoRow from '@components/ui/AppInfoRow.vue';
import AppSurface from '@components/ui/AppSurface.vue';
import { useProfileStore } from '@stores/profile.store';
import { useUiStore } from '@stores/ui.store';
import type { MiniappMenuItem } from '@types/miniapp';
import { formatManagerNextStart } from '@utils/manager-working-hours';
import { openSafeExternalUrl, toSafeExternalUrl } from '@utils/safe-external-url';

const router = useRouter();
const uiStore = useUiStore();
const profileStore = useProfileStore();
const { t } = useI18n();

const profilePhotoUrl = computed(() => toSafeExternalUrl(profileStore.data?.user.photoUrl));
const managerStatusText = computed(() => {
  const status = profileStore.data?.managerAvailability?.status;
  return status === 'working' ? t('profile.managersWorking') : t('profile.managersOffline');
});
const nextStartText = computed(() => {
  const value = profileStore.data?.managerAvailability?.nextStartAt;
  return formatManagerNextStart(value);
});
let managerRefreshTimer: ReturnType<typeof window.setTimeout> | null = null;

onMounted(async () => {
  if (!profileStore.loaded || !profileStore.data) {
    await profileStore.load();
  } else {
    void profileStore.refresh();
  }
});

onUnmounted(() => {
  clearManagerRefreshTimer();
});

watch(
  () => profileStore.data?.managerAvailability,
  (availability) => {
    clearManagerRefreshTimer();
    const boundary =
      availability?.status === 'working'
        ? availability.currentEndAt
        : availability?.status === 'offline'
          ? availability.nextStartAt
          : null;
    if (!boundary) {
      return;
    }
    const delay = Date.parse(boundary) - Date.now() + 1000;
    if (!Number.isFinite(delay) || delay <= 0) {
      return;
    }
    managerRefreshTimer = window.setTimeout(() => {
      void profileStore.refresh();
    }, Math.min(delay, 2_147_483_647));
  },
  { immediate: true },
);

function clearManagerRefreshTimer() {
  if (managerRefreshTimer !== null) {
    window.clearTimeout(managerRefreshTimer);
    managerRefreshTimer = null;
  }
}

function handleMenu(item: MiniappMenuItem) {
  if (item.action === 'route' && item.route) {
    void router.push(item.route);
    return;
  }

  if (item.action === 'link' && item.href) {
    openSafeExternalUrl(item.href);
    return;
  }

  uiStore.openMoreSheet();
}

function goToReferral() {
  void router.push({ name: 'referral' });
}
</script>
