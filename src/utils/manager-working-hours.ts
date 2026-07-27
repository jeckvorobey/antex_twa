/**
 * Форматирует UTC-время следующего открытия в локальной зоне браузера пользователя.
 */
export function formatManagerNextStart(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const nextStart = new Date(value);
  const now = new Date();
  const sameLocalDate =
    nextStart.getFullYear() === now.getFullYear() &&
    nextStart.getMonth() === now.getMonth() &&
    nextStart.getDate() === now.getDate();
  const options: Intl.DateTimeFormatOptions = sameLocalDate
    ? { hour: '2-digit', minute: '2-digit' }
    : { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' };

  return new Intl.DateTimeFormat(undefined, options).format(nextStart);
}
