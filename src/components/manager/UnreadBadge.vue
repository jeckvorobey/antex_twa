<template>
  <span v-if="count > 0" class="manager-unread-badge">{{ display }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ count: number }>();
const display = computed(() => (props.count > 99 ? '99+' : String(props.count)));
</script>
