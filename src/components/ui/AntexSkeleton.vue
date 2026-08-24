<template>
  <div
    :class="['antex-skeleton', `antex-skeleton--${preset}`]"
    aria-hidden="true"
  >
    <template v-if="preset === 'order-card'">
      <div class="antex-skeleton__topline">
        <q-skeleton type="text" width="42%" />
        <q-skeleton type="QBadge" width="84px" />
      </div>
      <q-skeleton type="text" width="68%" height="28px" />
      <q-skeleton type="text" width="84%" />
      <q-skeleton type="text" width="58%" />
      <div class="antex-skeleton__bottomline">
        <q-skeleton type="text" width="42px" />
        <q-skeleton type="QBtn" width="44px" height="44px" />
      </div>
    </template>
    <q-skeleton v-else-if="preset === 'cell'" type="rect" height="64px" />
    <q-skeleton v-else type="text" />
  </div>
</template>

<script setup lang="ts">
export type AntexSkeletonPreset = 'order-card' | 'cell' | 'text';

withDefaults(defineProps<{ preset?: AntexSkeletonPreset }>(), { preset: 'text' });
</script>
