<template>
  <q-btn
    :class="[
      'antex-button',
      'app-btn',
      `antex-button--${variant}`,
      `app-btn--${variant}`,
      { 'full-width': block },
    ]"
    :flat="variant === 'ghost'"
    :outline="variant === 'secondary'"
    :unelevated="variant === 'primary'"
    :loading="loading"
    :disable="disable"
    no-caps
  >
    <slot />
  </q-btn>
</template>

<script setup lang="ts">
export type AntexButtonVariant = 'primary' | 'secondary' | 'ghost';

withDefaults(
  defineProps<{
    variant?: AntexButtonVariant;
    block?: boolean;
    loading?: boolean;
    disable?: boolean;
  }>(),
  { variant: 'primary', block: false, loading: false, disable: false },
);
</script>
