import { afterEach, describe, expect, it, vi } from 'vitest';

import { formatManagerNextStart } from '@utils/manager-working-hours';

describe('formatManagerNextStart', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('formats the server UTC timestamp in the browser local time zone', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-27T08:00:00+00:00'));
    const format = vi.fn().mockReturnValue('12:00');
    const dateTimeFormat = vi.fn().mockReturnValue({ format });
    vi.stubGlobal('Intl', { ...Intl, DateTimeFormat: dateTimeFormat });

    expect(formatManagerNextStart('2026-07-27T09:00:00+00:00')).toBe('12:00');
    expect(dateTimeFormat).toHaveBeenCalledWith(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
    expect(format).toHaveBeenCalled();
  });

  it('includes the day when the next opening is not today', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-27T08:00:00+00:00'));
    const format = vi.fn().mockReturnValue('пн, 03.08, 09:00');
    const dateTimeFormat = vi.fn().mockReturnValue({ format });
    vi.stubGlobal('Intl', { ...Intl, DateTimeFormat: dateTimeFormat });

    expect(formatManagerNextStart('2026-08-03T06:00:00+00:00')).toBe('пн, 03.08, 09:00');
    expect(dateTimeFormat).toHaveBeenCalledWith(undefined, {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  });

  it('does not render an absent next opening time', () => {
    expect(formatManagerNextStart(null)).toBeNull();
  });
});
