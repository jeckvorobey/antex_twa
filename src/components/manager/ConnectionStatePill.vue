<template>
  <div class="manager-connection-pill" :class="`manager-connection-pill--${state}`">
    <span class="manager-connection-pill__dot" />
    <span>{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import type { ManagerRealtimeState } from '@types/manager-chat';

const props = defineProps<{
  state: ManagerRealtimeState;
}>();
const { t } = useI18n();

const label = computed(() => {
  switch (props.state) {
    case 'online':
      return t('manager.connection.online');
    case 'connecting':
      return t('manager.connection.connecting');
    case 'reconnecting':
      return t('manager.connection.reconnecting');
    case 'offline':
      return t('manager.connection.offline');
    default:
      return t('manager.connection.idle');
  }
});
</script>
