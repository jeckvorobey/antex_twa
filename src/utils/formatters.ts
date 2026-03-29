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
 * Собирает словарь частей даты через Intl без дрейфа порядка и служебных символов.
 */
function getDateParts(
  value: string,
  locale: string,
  options: Intl.DateTimeFormatOptions,
): Record<string, string> {
  return new Intl.DateTimeFormat(locale, {
    ...options,
    timeZone: 'UTC',
  })
    .formatToParts(new Date(value))
    .reduce<Record<string, string>>((parts, part) => {
      if (part.type !== 'literal') {
        parts[part.type] = part.value;
      }

      return parts;
    }, {});
}

/**
 * Форматирует дату и время коротким форматом для карточек и курсов.
 */
export function formatMiniappDateTime(value: string, locale?: string | null): string {
  const parts = getDateParts(value, resolveDateLocale(locale), {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return `${parts.day}.${parts.month}.${parts.year} ${parts.hour}:${parts.minute}`;
}

/**
 * Форматирует только время для истории заявок.
 */
export function formatMiniappTime(value: string, locale?: string | null): string {
  const parts = getDateParts(value, resolveDateLocale(locale), {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${parts.hour}:${parts.minute}`;
}

/**
 * Форматирует длинную дату для группировки истории без локальных суффиксов вроде "г.".
 */
export function formatMiniappLongDate(value: string, locale?: string | null): string {
  const parts = getDateParts(value, resolveDateLocale(locale), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return `${parts.day} ${parts.month} ${parts.year}`;
}

/**
 * Форматирует сумму валюты: целые — без дробной части, дробные — до 2 знаков.
 */
export function formatAmount(value: number, locale?: string | null): string {
  return new Intl.NumberFormat(resolveDateLocale(locale), {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  })
    .format(value)
    .replace(/\u00A0/g, ' ');
}
