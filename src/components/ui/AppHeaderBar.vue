<template>
  <q-header bordered class="app-browser-header text-white">
    <q-toolbar class="q-px-md">
      <AppBackButton v-if="backRouteName" @click="navigateBack" />
      <q-toolbar-title class="text-subtitle1 text-weight-bold">
        {{ headerTitle }}
      </q-toolbar-title>
    </q-toolbar>
  </q-header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import AppBackButton from '@components/ui/AppBackButton.vue';
import { resolveBackRouteName } from '@utils/telegram';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const backRouteName = computed(() => resolveBackRouteName(route.meta));
const headerTitle = computed(() => {
  const titleKey = route.meta.title;
  return typeof titleKey === 'string' ? t(titleKey) : t('common.brand');
});

/** Возвращает на объявленный в route meta родительский экран. */
function navigateBack(): void {
  if (backRouteName.value) {
    void router.push({ name: backRouteName.value });
  }
}
</script>
