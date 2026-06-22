<template>
  <div class="app-input-field">
    <div class="app-input-field__label">{{ label }}</div>

    <q-input
      v-if="type !== 'select'"
      :model-value="modelValue"
      :type="type"
      class="app-field"
      borderless
      dense
      hide-bottom-space
      v-bind="$attrs"
      @update:model-value="onInputUpdate"
    />

    <q-select
      v-else
      :model-value="modelValue"
      :options="options"
      class="app-field"
      borderless
      dense
      emit-value
      map-options
      hide-bottom-space
      options-dense
      behavior="menu"
      v-bind="$attrs"
      @update:model-value="$emit('update:modelValue', $event)"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  label: string;
  modelValue: string | number | null;
  options?: Array<{ label: string; value: string }>;
  type?: 'text' | 'number' | 'select';
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string | number | null];
}>();

function onInputUpdate(value: string | number | null) {
  if (props.type === 'number') {
    emit('update:modelValue', value === '' || value === null ? null : Number(value));
    return;
  }

  emit('update:modelValue', value);
}
</script>
