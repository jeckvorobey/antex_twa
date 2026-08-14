<template>
  <header class="manager-page-header">
    <q-btn
      v-if="back"
      flat
      round
      dense
      icon="arrow_back"
      class="manager-page-header__back"
      aria-label="Назад"
      @click="$emit('back')"
    />
    <div class="manager-page-header__copy">
      <div class="manager-page-header__title">{{ title }}</div>
      <div v-if="subtitle" class="manager-page-header__subtitle">{{ subtitle }}</div>
    </div>
    <div v-if="$slots.trailing" class="manager-page-header__trailing">
      <slot name="trailing" />
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  subtitle?: string | null;
  back?: boolean;
}>();

defineEmits<{
  back: [];
}>();
</script>
