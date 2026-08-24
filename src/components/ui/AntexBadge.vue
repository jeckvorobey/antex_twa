<template>
  <q-badge
    :class="['antex-badge', `antex-badge--${tone}`, `antex-badge--${kind}`]"
    :role="kind === 'status' ? 'status' : undefined"
    rounded
  >
    <span v-if="kind === 'status' || kind === 'dot'" class="antex-badge__dot" aria-hidden="true" />
    <slot>{{ label }}</slot>
  </q-badge>
</template>

<script setup lang="ts">
export type AntexBadgeTone =
  | 'neutral'
  | 'accent'
  | 'positive'
  | 'warning'
  | 'negative'
  | 'info';
export type AntexBadgeKind = 'status' | 'count' | 'dot';

withDefaults(
  defineProps<{
    tone?: AntexBadgeTone;
    kind?: AntexBadgeKind;
    label?: string;
  }>(),
  { tone: 'neutral', kind: 'status', label: '' },
);
</script>
