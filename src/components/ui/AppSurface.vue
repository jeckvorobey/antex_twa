<template>
  <q-card
    :class="[
      'app-surface',
      deep ? 'app-surface--deep' : null,
      elevated ? 'app-surface--elevated' : null,
      padded ? 'q-pa-md' : null,
    ]"
  >
    <slot />
  </q-card>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    deep?: boolean;
    padded?: boolean;
    elevated?: boolean;
  }>(),
  {
    deep: false,
    padded: false,
    elevated: true,
  },
);
</script>
