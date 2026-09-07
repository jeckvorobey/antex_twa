<template>
  <AntexNotice tone="offline" class="app-offline-notice">
    <template #title><slot name="title" /></template>
    <slot />
    <template v-if="compactBusinessHours" #aside>
      <q-badge class="app-offline-notice__hours">{{ compactBusinessHours }}</q-badge>
    </template>
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
