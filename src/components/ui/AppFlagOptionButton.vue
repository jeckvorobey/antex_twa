<template>
  <q-btn
    unelevated
    no-caps
    :disable="disable"
    class="app-flag-option-btn"
    :class="active ? 'app-flag-option-btn--active' : null"
    @click="$emit('click')"
  >
    <span class="app-flag-option-btn__content">
      <AppCurrencyMark class="app-flag-option-btn__mark" :mark="mark" />
      <span class="app-flag-option-btn__label">{{ label }}</span>
    </span>
  </q-btn>
</template>

<script setup lang="ts">
import AppCurrencyMark from '@components/ui/AppCurrencyMark.vue';

defineProps<{
  label: string;
  mark: string;
  active?: boolean;
  disable?: boolean;
}>();

defineEmits<{
  click: [];
}>();
</script>
