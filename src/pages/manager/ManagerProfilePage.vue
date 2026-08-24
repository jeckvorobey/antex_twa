<template>
  <q-page class="manager-page">
    <ManagerPageHeader
      :title="t('manager.profile.title')"
      :subtitle="t('manager.profile.subtitle')"
    >
      <template #trailing>
        <ConnectionStatePill :state="realtimeStore.state" />
      </template>
    </ManagerPageHeader>

    <AntexCard tag="section" class="manager-profile-card">
      <div class="manager-profile-card__avatar">{{ initials }}</div>
      <div>
        <div class="manager-profile-card__name">{{ displayName }}</div>
        <div class="manager-profile-card__role">{{ t('manager.profile.role') }}</div>
      </div>
    </AntexCard>

    <div class="manager-info-stack">
      <AntexCard tag="section" class="manager-info-card">
        <div class="manager-info-card__label">{{ t('manager.profile.realtime.label') }}</div>
        <ConnectionStatePill :state="realtimeStore.state" />
        <div class="manager-info-card__text">
          {{ t('manager.profile.realtime.text') }}
        </div>
      </AntexCard>

      <AntexCard tag="section" class="manager-info-card">
        <div class="manager-info-card__label">{{ t('manager.profile.notifications.label') }}</div>
        <div class="manager-info-card__text">
          {{ t('manager.profile.notifications.text') }}
        </div>
      </AntexCard>

      <AntexCard v-if="authStore.user?.username" tag="section" class="manager-info-card">
        <div class="manager-info-card__label">{{ t('manager.profile.telegram') }}</div>
        <div class="manager-info-card__text">@{{ authStore.user.username }}</div>
      </AntexCard>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import ConnectionStatePill from '@components/manager/ConnectionStatePill.vue';
import ManagerPageHeader from '@components/manager/ManagerPageHeader.vue';
import AntexCard from '@components/ui/AntexCard.vue';
import { useAuthStore } from '@stores/auth.store';
import { useManagerRealtimeStore } from '@stores/manager-realtime.store';

const authStore = useAuthStore();
const realtimeStore = useManagerRealtimeStore();
const { t } = useI18n();

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
