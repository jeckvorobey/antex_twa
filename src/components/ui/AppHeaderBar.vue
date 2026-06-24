<template>
  <div class="app-header-bar">
    <div class="app-header-bar__brand">
      <div class="app-header-bar__logo">
        <q-img
          :src="logoImage"
          class="app-header-bar__logo-image"
          fit="cover"
          width="100%"
          height="100%"
          alt="AntEx logo"
          no-spinner
        />
      </div>
      <div class="app-header-bar__title">{{ t('common.brand') }}</div>
    </div>
    <q-btn
      round
      flat
      class="app-header-bar__avatar-button"
      :aria-label="t('nav.profile')"
      @click="openProfile"
    >
      <q-avatar class="app-header-bar__avatar">
        <q-img
          v-if="userPhotoUrl"
          :src="userPhotoUrl"
          fit="cover"
          width="100%"
          height="100%"
          :alt="t('nav.profile')"
          no-spinner
        />
        <span v-else>{{ userInitials }}</span>
      </q-avatar>
    </q-btn>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@stores/auth.store';
import logoImage from '../../assets/images/logo.PNG';

const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();

const userPhotoUrl = computed(() => authStore.user?.photo_url ?? null);

const userInitials = computed(() => {
  const user = authStore.user;
  const nameParts = [user?.first_name, user?.last_name].filter((part): part is string =>
    Boolean(part?.trim()),
  );

  if (nameParts.length) {
    return nameParts
      .map((part) => part.trim()[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  const username = user?.username?.trim();
  return (username ? username[0] : 'A').toUpperCase();
});

function openProfile() {
  void router.push({ name: 'profile' });
}
</script>
