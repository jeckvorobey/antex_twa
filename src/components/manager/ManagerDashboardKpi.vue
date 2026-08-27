<template>
  <AntexCard :elevated="false" class="manager-dashboard-kpi">
    <span class="manager-dashboard-kpi__label">{{ label }}</span>
    <strong class="manager-dashboard-kpi__value">{{ value }}</strong>
    <span
      v-if="trend"
      :class="['manager-dashboard-kpi__trend', `manager-dashboard-kpi__trend--${tone}`]"
    >
      {{ trend }}
    </span>
  </AntexCard>
</template>

<script setup lang="ts">
import AntexCard from '@components/ui/AntexCard.vue';

withDefaults(
  defineProps<{
    label: string;
    value: string | number;
    trend?: string | null;
    tone?: 'positive' | 'accent';
  }>(),
  { trend: null, tone: 'accent' },
);
</script>
