<template>
  <span class="manager-status-chip" :class="`manager-status-chip--${tone}`">{{ label }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ status: number }>();

const label = computed(() => {
  switch (props.status) {
    case 1:
      return 'Новая';
    case 2:
      return 'В работе';
    case 3:
      return 'Завершена';
    case 4:
      return 'Отменена';
    default:
      return `Статус ${props.status}`;
  }
});

const tone = computed(() => {
  switch (props.status) {
    case 2:
      return 'active';
    case 3:
      return 'done';
    case 4:
      return 'cancelled';
    default:
      return 'new';
  }
});
</script>
