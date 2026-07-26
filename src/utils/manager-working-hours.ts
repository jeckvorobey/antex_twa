/**
 * Форматирует UTC-время следующего открытия в локальной зоне браузера пользователя.
 */
export function formatManagerNextStart(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(
    new Date(value),
  );
}
