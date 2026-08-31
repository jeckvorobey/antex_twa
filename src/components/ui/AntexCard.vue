<template>
  <q-card
    :tag="tag"
    :class="[
      'antex-card',
      'antex-card--gold-border',
      `antex-card--${surface}`,
      {
        'antex-card--padded': padded,
        'antex-card--elevated': elevated,
        'app-card-shadow': elevated,
      },
    ]"
  >
    <slot />
  </q-card>
</template>

<script setup lang="ts">
export type AntexCardSurface = 'default' | 'deep' | 'raised';

withDefaults(
  defineProps<{
    surface?: AntexCardSurface;
    padded?: boolean;
    elevated?: boolean;
    tag?: string;
  }>(),
  { surface: 'default', padded: false, elevated: true, tag: 'div' },
);
</script>
