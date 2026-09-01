<template>
  <q-page class="manager-page manager-profile">
    <AppHeaderBar :eyebrow="t('manager.role')" profile-route-name="managerProfile" />

    <h1 class="manager-profile__title">{{ t('manager.profile.title') }}</h1>

    <AntexCard tag="section" class="manager-profile-card">
      <q-avatar class="manager-profile-card__avatar">
        <q-img
          v-if="showProfilePhoto"
          :src="profilePhotoUrl"
          fit="cover"
          width="100%"
          height="100%"
          :alt="displayName"
          no-spinner
          @error="handleProfilePhotoError"
        />
        <span v-else class="manager-profile-card__initials">{{ initials }}</span>
      </q-avatar>
      <div>
        <div class="manager-profile-card__name">{{ displayName }}</div>
        <div class="manager-profile-card__role">{{ t('manager.profile.role') }}</div>
      </div>
    </AntexCard>

    <div class="manager-info-stack">
      <AntexCard tag="section" class="manager-info-card manager-info-card--realtime">
        <div class="manager-info-card__copy">
          <div class="manager-info-card__label">{{ t('manager.profile.realtime.label') }}</div>
          <div class="manager-info-card__text">
            {{ t('manager.profile.realtime.text') }}
          </div>
        </div>
        <ConnectionStatePill :state="realtimeStore.state" />
      </AntexCard>

    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import ConnectionStatePill from '@components/manager/ConnectionStatePill.vue';
import AntexCard from '@components/ui/AntexCard.vue';
import AppHeaderBar from '@components/ui/AppHeaderBar.vue';
import { useAuthStore } from '@stores/auth.store';
import { useManagerRealtimeStore } from '@stores/manager-realtime.store';
import { toSafeExternalUrl } from '@utils/safe-external-url';

const authStore = useAuthStore();
const realtimeStore = useManagerRealtimeStore();
const { t } = useI18n();

const profilePhotoFailed = ref(false);
const profilePhotoUrl = computed(() => toSafeExternalUrl(authStore.user?.photo_url));
const showProfilePhoto = computed(() => Boolean(profilePhotoUrl.value) && !profilePhotoFailed.value);

watch(profilePhotoUrl, () => {
  profilePhotoFailed.value = false;
});

function handleProfilePhotoError(): void {
  profilePhotoFailed.value = true;
}

const displayName = computed(() => {
  const user = authStore.user;
  if (!user) {
    return t('manager.profile.fallbackName');
  }
  return (
    [user.first_name, user.last_name].filter(Boolean).join(' ') ||
    user.username ||
    t('manager.profile.fallbackName')
  );
});

const initials = computed(() => {
  const value = displayName.value.replace('@', '').trim();
  const parts = value.split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
});
</script>
