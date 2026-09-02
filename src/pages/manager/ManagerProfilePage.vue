<template>
  <q-page class="manager-page manager-profile">
    <AppHeaderBar :eyebrow="t('manager.role')" profile-route-name="managerProfile" />

    <h1 class="manager-profile__title">{{ t('manager.profile.title') }}</h1>

    <AntexCard tag="section" class="manager-profile-card">
      <div>
        <div class="manager-profile-card__name">{{ displayName }}</div>
        <div class="manager-profile-card__role">{{ t('manager.profile.role') }}</div>
      </div>
    </AntexCard>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import AntexCard from '@components/ui/AntexCard.vue';
import AppHeaderBar from '@components/ui/AppHeaderBar.vue';
import { useAuthStore } from '@stores/auth.store';

const authStore = useAuthStore();
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
</script>
