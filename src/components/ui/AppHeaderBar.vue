<template>
  <div class="app-header-bar">
    <div class="app-header-bar__brand">
      <div class="app-header-bar__logo">
        <span>AE</span>
      </div>
      <div class="app-header-bar__title">{{ t('common.brand') }}</div>
    </div>

    <div class="app-header-bar__actions">
      <AppButton
        variant="ghost"
        icon="notifications_none"
        :aria-label="t('common.notifications')"
        @click="uiStore.openMoreSheet()"
      />
      <AppButton
        variant="ghost"
        icon="person_outline"
        :aria-label="t('common.profile')"
        @click="goProfile"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import { useUiStore } from '@stores/ui.store';

import AppButton from './AppButton.vue';

const router = useRouter();
const uiStore = useUiStore();
const { t } = useI18n();

/**
 * Переводит пользователя на экран профиля из шапки приложения.
 */
function goProfile() {
  void router.push({ name: 'profile' });
}
</script>
