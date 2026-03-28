<template>
  <q-btn
    :class="['app-btn', variantClass, block ? 'full-width' : null]"
    :flat="variant === 'ghost'"
    :outline="variant === 'secondary'"
    :unelevated="variant === 'primary'"
    no-caps
    v-bind="$attrs"
  >
    <slot />
  </q-btn>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost';
    block?: boolean;
  }>(),
  {
    variant: 'primary',
    block: false,
  },
);

const variantClass = computed(() => {
  if (props.variant === 'secondary') return 'app-btn--secondary';
  if (props.variant === 'ghost') return 'app-btn--ghost';
  return 'app-btn--primary';
});
</script>
