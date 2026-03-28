<template>
  <div class="row items-center justify-between q-px-md q-pt-md q-pb-sm">
    <div class="row items-center q-gutter-sm">
      <div class="row items-center justify-center" style="width: 28px; height: 28px; border-radius: 6px; background: var(--antex-gold-gradient);">
        <span style="font-family: 'Montserrat', sans-serif; font-size: 11px; font-weight: 800; color: var(--antex-bg-primary);">AE</span>
      </div>
      <div>
        <div
          style="font-family: 'Montserrat', sans-serif; font-size: 18px; font-weight: 700; color: var(--antex-gold-base);"
        >
          {{ title }}
        </div>
      </div>
    </div>

    <div class="row items-center q-gutter-sm">
      <AppButton variant="ghost" icon="notifications_none" :aria-label="t('common.notifications')" />
      <AppButton variant="ghost" icon="person_outline" :aria-label="t('common.profile')" @click="goProfile" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import AppButton from './AppButton.vue';

defineProps<{
  title: string;
}>();

const router = useRouter();
const { t } = useI18n();

/**
 * Переводит пользователя на экран профиля из шапки приложения.
 */
function goProfile() {
  router.push({ name: 'profile' });
}
</script>
