<template>
  <div class="manager-connection-pill" :class="`manager-connection-pill--${state}`">
    <span class="manager-connection-pill__dot" />
    <span>{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import type { ManagerRealtimeState } from '@types/manager-chat';

const props = defineProps<{
  state: ManagerRealtimeState;
}>();

const label = computed(() => {
  switch (props.state) {
    case 'online':
      return 'Realtime online';
    case 'connecting':
      return 'Подключение';
    case 'reconnecting':
      return 'Переподключение';
    case 'offline':
      return 'Offline';
    default:
      return 'Realtime';
  }
});
</script>
