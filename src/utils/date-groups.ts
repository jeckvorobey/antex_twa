import { formatMiniappLongDate } from '@utils/formatters';

export interface DateGroup<T> {
  label: string;
  items: T[];
}

export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Группирует уже отсортированные элементы по календарной дате без изменения порядка.
 */
export function groupItemsByDate<T>(
  items: readonly T[],
  resolveDate: (item: T) => string,
  locale?: string | null,
): DateGroup<T>[] {
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const label = formatMiniappLongDate(resolveDate(item), locale);
    const group = groups.get(label);

    if (group) {
      group.push(item);
    } else {
      groups.set(label, [item]);
    }
  }

  return Array.from(groups, ([label, groupedItems]) => ({ label, items: groupedItems }));
}
