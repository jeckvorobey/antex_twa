<template>
  <div class="manager-empty-state">
    <div class="manager-empty-state__icon">
      <q-icon :name="icon" size="28px" />
    </div>
    <div class="manager-empty-state__title">{{ title }}</div>
    <div v-if="text" class="manager-empty-state__text">{{ text }}</div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    text?: string | null;
    icon?: string;
  }>(),
  { icon: 'forum', text: null },
);
</script>
