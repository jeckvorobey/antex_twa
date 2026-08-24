<template>
  <div class="manager-empty-state antex-border-gold">
    <div class="manager-empty-state__icon">
      <q-icon :name="icon" size="28px" />
    </div>
    <div class="manager-empty-state__title">{{ title }}</div>
    <div v-if="text" class="manager-empty-state__text">{{ text }}</div>
    <q-btn
      v-if="actionLabel"
      outline
      rounded
      no-caps
      color="primary"
      :label="actionLabel"
      class="manager-empty-state__action"
      @click="$emit('action')"
    />
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    text?: string | null;
    icon?: string;
    actionLabel?: string | null;
  }>(),
  { actionLabel: null, icon: 'forum', text: null },
);

defineEmits<{ action: [] }>();
</script>
