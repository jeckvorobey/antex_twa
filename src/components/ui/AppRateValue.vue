<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { formatReadableNumber } from '@utils/formatters';

const props = withDefaults(
  defineProps<{
    value: string | number;
    shimmer?: boolean;
  }>(),
  {
    shimmer: false,
  },
);

const { locale } = useI18n();
const displayValue = computed(() => formatReadableNumber(props.value, locale.value) || String(props.value));
const displayKey = computed(() => displayValue.value);
</script>

<template>
  <transition name="app-rate-swap" mode="out-in">
    <span :key="displayKey" :class="['app-rate-value', shimmer ? 'app-rate-value--shimmer' : null]">
      {{ displayValue }}
    </span>
  </transition>
</template>
