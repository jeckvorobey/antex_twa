<template>
  <div :class="['app-header-bar', { 'app-header-bar--with-back': backRouteName }]">
    <AppBackButton v-if="backRouteName" @click="navigateBack" />
    <div class="app-header-bar__brand">
      <div class="app-header-bar__logo">
        <q-img
          :src="logoImage"
          class="app-header-bar__logo-image"
          fit="cover"
          width="100%"
          height="100%"
          :alt="t('common.logoAlt')"
          no-spinner
        />
      </div>
      <div class="app-header-bar__title">{{ t('common.brand') }}</div>
    </div>
    <div v-if="eyebrow" class="app-header-bar__eyebrow">{{ eyebrow }}</div>
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
import { useRoute, useRouter } from 'vue-router';

import AppBackButton from '@components/ui/AppBackButton.vue';
import { useAuthStore } from '@stores/auth.store';
import { toSafeExternalUrl } from '@utils/safe-external-url';
import logoImage from '../../assets/images/logo.PNG';

const props = withDefaults(
  defineProps<{
    eyebrow?: string | null;
    profileRouteName?: string;
  }>(),
  { eyebrow: null, profileRouteName: 'profile' },
);

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const backRouteName = computed(() => {
  const target = route.meta.backRouteName;
  return typeof target === 'string' ? target : null;
});

const userPhotoUrl = computed(() => toSafeExternalUrl(authStore.user?.photo_url));

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

/** Открывает профиль из постоянного правого avatar action. */
function openProfile() {
  void router.push({ name: props.profileRouteName });
}

/** Возвращает на объявленный в route meta родительский экран. */
function navigateBack() {
  if (backRouteName.value) {
    void router.push({ name: backRouteName.value });
  }
}
</script>
