<template>
  <q-input
    :model-value="modelValue"
    borderless
    dense
    clearable
    clear-icon="close"
    :debounce="250"
    :placeholder="placeholder"
    class="manager-search-input"
    @update:model-value="updateValue"
  >
    <template #prepend><q-icon name="search" size="18px" /></template>
  </q-input>
</template>

<script setup lang="ts">
defineProps<{ modelValue: string; placeholder: string }>();
const emit = defineEmits<{
  'update:modelValue': [value: string];
  search: [];
}>();

function updateValue(value: string | number | null): void {
  emit('update:modelValue', String(value ?? ''));
  emit('search');
}
</script>
