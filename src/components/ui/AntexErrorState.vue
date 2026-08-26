<template>
  <AntexEmptyState
    class="antex-error-state"
    role="alert"
    :title="title"
    :description="description"
    :action-label="retryLabel"
    icon="error_outline"
    @action="emit('retry')"
  />
</template>

<script setup lang="ts">
import AntexEmptyState from '@components/ui/AntexEmptyState.vue';

defineProps<{
  title: string;
  description?: string | null;
  retryLabel: string;
}>();

const emit = defineEmits<{ retry: [] }>();
</script>
