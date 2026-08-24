<template>
  <AntexNotice tone="offline" class="app-offline-notice">
    <template #title><slot name="title" /></template>
    <span><slot /></span>
    <span class="app-offline-notice__hours">{{ compactBusinessHours }}</span>
  </AntexNotice>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import AntexNotice from '@components/ui/AntexNotice.vue';

const props = defineProps<{ businessHours: string }>();
const compactBusinessHours = computed(() =>
  props.businessHours.replace(/^Ежедневно\s+/i, '').trim(),
);
</script>
