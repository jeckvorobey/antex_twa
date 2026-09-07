<template>
  <AntexCell
    :title="title"
    :description="subtitle"
    :clickable="clickable"
    class="app-info-row"
    @click="emit('click')"
  >
    <template #before><q-icon :name="icon" size="18px" /></template>
    <template v-if="badge || value" #after>
      <AntexBadge v-if="badge" :tone="badgeTone" :label="badge" />
      <div v-if="value" class="app-info-row__value">{{ value }}</div>
    </template>
  </AntexCell>
</template>

<script setup lang="ts">
import AntexBadge from '@components/ui/AntexBadge.vue';
import AntexCell from '@components/ui/AntexCell.vue';

withDefaults(
  defineProps<{
    icon: string;
    title: string;
    subtitle?: string | null;
    value?: string | null;
    badge?: string | null;
    badgeTone?: 'positive' | 'warning' | 'negative' | 'info';
    clickable?: boolean;
  }>(),
  {
    subtitle: null,
    value: null,
    badge: null,
    badgeTone: 'positive',
    clickable: false,
  },
);

const emit = defineEmits<{
  click: [];
}>();
</script>
