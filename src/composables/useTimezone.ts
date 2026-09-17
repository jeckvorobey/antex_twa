import { computed } from 'vue';
import { useAuthStore } from '@stores/auth.store';

function minutesOffsetToTimezone(minutes: string): string {
  const offset = parseInt(minutes, 10);
  if (Number.isNaN(offset)) return 'UTC';

  const sign = offset >= 0 ? '+' : '-';
  const absOffset = Math.abs(offset);
  const hours = Math.floor(absOffset / 60).toString().padStart(2, '0');
  const mins = (absOffset % 60).toString().padStart(2, '0');
  return `UTC${sign}${hours}:${mins}`;
}

export function useTimezone() {
  const authStore = useAuthStore();

  const resolvedTimezone = computed(() => {
    // 1. Telegram time_zone (смещение в минутах)
    if (authStore.userTimezone) {
      return minutesOffsetToTimezone(authStore.userTimezone);
    }

    // 2. Браузерный timezone
    if (typeof Intl !== 'undefined') {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }

    // 3. Фоллбек
    return 'UTC';
  });

  return {
    timezone: resolvedTimezone,
    getTimezone: () => resolvedTimezone.value,
  };
}