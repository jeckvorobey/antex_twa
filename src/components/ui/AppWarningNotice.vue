<template>
  <AntexNotice
    tone="warning"
    :dismissible="dismissible"
    :dismiss-label="t('common.close')"
    class="app-warning-notice"
    @dismiss="emit('dismiss')"
  >
    <template #title><slot name="title" /></template>
    <slot />
  </AntexNotice>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import AntexNotice from '@components/ui/AntexNotice.vue';

withDefaults(defineProps<{ dismissible?: boolean }>(), { dismissible: true });
const emit = defineEmits<{ dismiss: [] }>();
const { t } = useI18n();
</script>
