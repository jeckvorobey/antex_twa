<template>
  <q-page class="manager-page manager-profile">
    <AppHeaderBar :eyebrow="t('manager.role')" profile-route-name="managerProfile" />

    <h1 class="manager-profile__title">{{ t('manager.profile.title') }}</h1>

    <AntexCard tag="section" class="manager-profile-card">
      <q-avatar class="manager-profile-card__avatar">
        <q-img
          v-if="profilePhotoUrl"
          :src="profilePhotoUrl"
          fit="cover"
          width="100%"
          height="100%"
          :alt="displayName"
          no-spinner
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

      <AntexCard tag="section" class="manager-info-card">
        <div class="manager-info-card__copy">
          <div class="manager-info-card__label">{{ t('manager.profile.notifications.label') }}</div>
          <div class="manager-info-card__text">
            {{ t('manager.profile.notifications.text') }}
          </div>
        </div>
      </AntexCard>

      <AntexCard v-if="authStore.user?.username" tag="section" class="manager-info-card">
        <div class="manager-info-card__copy">
          <div class="manager-info-card__label">{{ t('manager.profile.telegram') }}</div>
          <div class="manager-info-card__text">@{{ authStore.user.username }}</div>
        </div>
      </AntexCard>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
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

const profilePhotoUrl = computed(() => toSafeExternalUrl(authStore.user?.photo_url));

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
