<template>
  <q-page class="app-page">
    <div class="app-screen app-screen--profile">
      <AppStatusBar />

      <div class="app-profile-hero">
        <div class="app-profile-hero__avatar">
          <q-icon name="person_outline" size="34px" />
        </div>
        <div class="app-profile-hero__name">{{ profileStore.data?.user.displayName }}</div>
        <div class="app-profile-hero__username">
          {{ profileStore.data?.user.username ? `@${profileStore.data.user.username}` : t('common.brand') }}
        </div>
      </div>

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

      <q-inner-loading :showing="profileStore.loading" dark />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import AppInfoRow from '@components/ui/AppInfoRow.vue';
import AppStatusBar from '@components/ui/AppStatusBar.vue';
import AppSurface from '@components/ui/AppSurface.vue';
import { useProfileStore } from '@stores/profile.store';
import { useUiStore } from '@stores/ui.store';
import type { MiniappMenuItem } from '@types/miniapp';

const router = useRouter();
const uiStore = useUiStore();
const profileStore = useProfileStore();
const { t } = useI18n();

onMounted(async () => {
  if (!profileStore.data) {
    await profileStore.load();
  }
});

function handleMenu(item: MiniappMenuItem) {
  if (item.action === 'route' && item.route) {
    void router.push(item.route);
    return;
  }

  if (item.action === 'link' && item.href) {
    window.open(item.href, '_blank');
    return;
  }

  uiStore.openMoreSheet();
}
</script>
