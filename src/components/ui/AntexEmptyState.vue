<template>
  <AntexCard class="antex-empty-state" padded :elevated="false">
    <div class="antex-empty-state__icon" aria-hidden="true">
      <slot name="icon"><q-icon :name="icon" /></slot>
    </div>
    <div class="antex-empty-state__title">{{ title }}</div>
    <div v-if="$slots.default || description" class="antex-empty-state__description">
      <slot>{{ description }}</slot>
    </div>
    <AntexButton
      v-if="actionLabel"
      variant="secondary"
      class="antex-empty-state__action"
      @click="emit('action')"
    >
      {{ actionLabel }}
    </AntexButton>
  </AntexCard>
</template>

<script setup lang="ts">
import AntexButton from '@components/ui/AntexButton.vue';
import AntexCard from '@components/ui/AntexCard.vue';

withDefaults(
  defineProps<{
    title: string;
    description?: string | null;
    actionLabel?: string | null;
    icon?: string;
  }>(),
  { description: null, actionLabel: null, icon: 'inbox' },
);
const emit = defineEmits<{ action: [] }>();
</script>
