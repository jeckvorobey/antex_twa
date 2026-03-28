<template>
  <q-card :class="['app-surface', deep ? 'app-surface--deep' : null, padded ? 'q-pa-md' : null]">
    <slot />
  </q-card>
</template>

<script setup lang="ts">
defineProps<{
  deep?: boolean;
  padded?: boolean;
}>();
</script>
