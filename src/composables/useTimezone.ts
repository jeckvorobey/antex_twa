import { computed } from 'vue';
import { useAuthStore } from '@stores/auth.store';

/** Telegram отдаёт либо смещение в минутах, либо IANA-имя зоны. */
function minutesOffsetToTimezone(minutes: string): string {
  // IANA-имя (например "Europe/Berlin") используем напрямую.
  if (minutes.includes('/')) {
    return minutes.trim();
  }

  const offset = parseInt(minutes, 10);
  if (Number.isNaN(offset)) return 'UTC';

  // Intl валиден в диапазоне ±23:59, бо́льшие значения дают RangeError у потребителей.
  const clamped = Math.min(Math.max(offset, -1439), 1439);
  const sign = clamped >= 0 ? '+' : '-';
  const absOffset = Math.abs(clamped);
  const hours = Math.floor(absOffset / 60).toString().padStart(2, '0');
  const mins = (absOffset % 60).toString().padStart(2, '0');
  return `UTC${sign}${hours}:${mins}`;
}

function isValidTimezone(zone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

export function useTimezone() {
  const authStore = useAuthStore();

  const resolvedTimezone = computed(() => {
    // 1. Telegram time_zone (смещение в минутах или IANA-имя)
    const telegramZone = authStore.userTimezone
      ? minutesOffsetToTimezone(authStore.userTimezone)
      : null;
    if (telegramZone && isValidTimezone(telegramZone)) {
      return telegramZone;
    }

    // 2. Браузерный timezone
    if (typeof Intl !== 'undefined') {
      const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (browserZone && isValidTimezone(browserZone)) {
        return browserZone;
      }
    }

    // 3. Фоллбек
    return 'UTC';
  });

  return {
    timezone: resolvedTimezone,
    getTimezone: () => resolvedTimezone.value,
  };
}
