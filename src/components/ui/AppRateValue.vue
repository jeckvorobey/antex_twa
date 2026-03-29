<template>
  <transition name="app-rate-swap" mode="out-in">
    <span :key="displayKey" :class="['app-rate-value', shimmer ? 'app-rate-value--shimmer' : null]">
      {{ value }}
    </span>
  </transition>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    value: string;
    shimmer?: boolean;
  }>(),
  {
    shimmer: false,
  },
);

const displayKey = computed(() => props.value);
</script>
