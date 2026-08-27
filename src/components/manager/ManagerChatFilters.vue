<template>
  <div class="manager-chat-filters" role="group" :aria-label="ariaLabel">
    <q-btn
      no-caps
      unelevated
      :class="['manager-filter-pill', { 'manager-filter-pill--active': !unreadOnly }]"
      :label="allLabel"
      @click="$emit('change', false)"
    />
    <q-btn
      no-caps
      unelevated
      :class="['manager-filter-pill', { 'manager-filter-pill--active': unreadOnly }]"
      :label="unreadLabel"
      @click="$emit('change', true)"
    />
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
