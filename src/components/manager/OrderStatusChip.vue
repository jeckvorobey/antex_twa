<template>
  <span class="manager-status-chip" :class="`manager-status-chip--${tone}`">{{ label }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{ status: number }>();
const { t } = useI18n();

const label = computed(() => {
  switch (props.status) {
    case 1:
      return t('manager.orderStatus.new');
    case 2:
      return t('manager.orderStatus.active');
    case 3:
      return t('manager.orderStatus.done');
    case 4:
      return t('manager.orderStatus.cancelled');
    default:
      return t('manager.orderStatus.unknown', { status: props.status });
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
