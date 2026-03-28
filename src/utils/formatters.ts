/**
 * Возвращает BCP 47 locale для форматирования дат miniapp.
 */
export function resolveDateLocale(locale?: string | null): string {
  if (!locale) {
    return 'ru-RU';
  }

  const normalized = locale.toLowerCase();
  if (normalized.startsWith('ru')) {
    return 'ru-RU';
  }

  return 'en-US';
}

/**
 * Форматирует дату и время коротким форматом для карточек и курсов.
 */
export function formatMiniappDateTime(value: string, locale?: string | null): string {
  return new Intl.DateTimeFormat(resolveDateLocale(locale), {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(value));
}

/**
 * Форматирует только время для истории заявок.
 */
export function formatMiniappTime(value: string, locale?: string | null): string {
  return new Intl.DateTimeFormat(resolveDateLocale(locale), {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

/**
 * Форматирует сумму валюты: целые — без дробной части, дробные — до 2 знаков.
 */
export function formatAmount(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
