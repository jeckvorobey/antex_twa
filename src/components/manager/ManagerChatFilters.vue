<template>
  <div class="app-chip-row manager-chat-filters" role="group" :aria-label="ariaLabel">
    <q-chip
      clickable
      :class="['app-chip', { 'app-chip--active': !unreadOnly }]"
      :aria-pressed="!unreadOnly"
      @click="$emit('change', false)"
    >
      {{ allLabel }}
    </q-chip>
    <q-chip
      clickable
      :class="['app-chip', { 'app-chip--active': unreadOnly }]"
      :aria-pressed="unreadOnly"
      @click="$emit('change', true)"
    >
      {{ unreadLabel }}
    </q-chip>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  unreadOnly: boolean;
  allLabel: string;
  unreadLabel: string;
  ariaLabel: string;
}>();
defineEmits<{ change: [value: boolean] }>();
</script>
