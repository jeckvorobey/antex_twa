<template>
  <div class="app-status-bar">
    <span class="app-status-bar__time">{{ timeLabel }}</span>

    <div class="app-status-bar__icons">
      <q-icon name="signal_cellular_4_bar" size="16px" />
      <q-icon name="wifi" size="16px" />
      <q-icon name="battery_full" size="18px" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

const now = ref(new Date());
let syncTimer: ReturnType<typeof setInterval> | undefined;

const timeLabel = computed(() =>
  new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(now.value),
);

/**
 * Обновляет показ времени с минутной дискретностью для псевдо status bar.
 */
function syncTime() {
  now.value = new Date();
}

onMounted(() => {
  syncTime();
  syncTimer = setInterval(syncTime, 60_000);
});

onBeforeUnmount(() => {
  if (syncTimer) {
    clearInterval(syncTimer);
  }
});
</script>
