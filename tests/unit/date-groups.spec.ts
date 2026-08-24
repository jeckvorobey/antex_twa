import { describe, expect, it } from 'vitest';

import { groupItemsByDate, localDateKey } from '../../src/utils/date-groups';

type Item = { id: number; createdAt: string };

describe('groupItemsByDate', () => {
  it('groups items in one pass while preserving group and item order', () => {
    const items: Item[] = [
      { id: 1, createdAt: '2026-07-24T12:00:00Z' },
      { id: 2, createdAt: '2026-07-24T09:00:00Z' },
      { id: 3, createdAt: '2026-07-23T18:00:00Z' },
    ];

    expect(groupItemsByDate(items, (item) => item.createdAt, 'ru')).toEqual([
      { label: '24 июля 2026', items: [items[0], items[1]] },
      { label: '23 июля 2026', items: [items[2]] },
    ]);
  });

  it('returns an empty group list for empty input', () => {
    expect(groupItemsByDate([], (item: Item) => item.createdAt, 'ru')).toEqual([]);
  });

  it('uses the local calendar day instead of the UTC day as a grouping key', () => {
    const date = new Date(2026, 6, 25, 0, 30);

    expect(localDateKey(date)).toBe('2026-07-25');
  });
});
