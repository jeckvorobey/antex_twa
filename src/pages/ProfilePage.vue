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

      <AexBalanceCard
        v-if="aexBalance !== null"
        :balance="aexBalance"
        clickable
        @click="goToReferral"
      />

      <AppSurface class="app-profile-card">
        <AppInfoRow
          icon="group_add"
          :title="t('profile.referralProgram')"
          clickable
          @click="goToReferral"
        />
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
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import AexBalanceCard from '@components/ui/AexBalanceCard.vue';
import AppInfoRow from '@components/ui/AppInfoRow.vue';
import AppSurface from '@components/ui/AppSurface.vue';
import { useAexStore } from '@stores/aex.store';
import { useProfileStore } from '@stores/profile.store';
import { useUiStore } from '@stores/ui.store';
import type { MiniappMenuItem } from '@types/miniapp';

const router = useRouter();
const uiStore = useUiStore();
const profileStore = useProfileStore();
const aexStore = useAexStore();
const { t } = useI18n();

const profilePhotoUrl = computed(() => profileStore.data?.user.photoUrl ?? null);

const aexBalance = computed(() => {
  const fromStore = aexStore.balance?.available;
  if (fromStore !== undefined && fromStore !== null) {
    return fromStore;
  }
  return profileStore.data?.aex?.balance.available ?? null;
});

onMounted(async () => {
  if (!profileStore.loaded || !profileStore.data) {
    await profileStore.load();
  } else {
    void profileStore.refresh();
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

function goToReferral() {
  void router.push({ name: 'referral' });
}
</script>
