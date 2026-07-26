import { describe, expect, it, vi } from 'vitest';

import { formatManagerNextStart } from '@utils/manager-working-hours';

describe('formatManagerNextStart', () => {
  it('formats the server UTC timestamp in the browser local time zone', () => {
    const format = vi.fn().mockReturnValue('12:00');
    const dateTimeFormat = vi.fn().mockReturnValue({ format });
    vi.stubGlobal('Intl', { ...Intl, DateTimeFormat: dateTimeFormat });

    expect(formatManagerNextStart('2026-07-27T09:00:00+00:00')).toBe('12:00');
    expect(dateTimeFormat).toHaveBeenCalledWith(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
    expect(format).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('does not render an absent next opening time', () => {
    expect(formatManagerNextStart(null)).toBeNull();
  });
});
