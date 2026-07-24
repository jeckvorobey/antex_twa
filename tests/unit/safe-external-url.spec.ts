import { describe, expect, it, vi } from 'vitest';

import { openSafeExternalUrl, toSafeExternalUrl } from '../../src/utils/safe-external-url';

describe('safe external URLs', () => {
  it('allows only valid HTTPS URLs', () => {
    expect(toSafeExternalUrl('https://t.me/antex')).toBe('https://t.me/antex');
    expect(toSafeExternalUrl(' javascript:alert(1) ')).toBeNull();
    expect(toSafeExternalUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(toSafeExternalUrl('http://example.com')).toBeNull();
    expect(toSafeExternalUrl('not a url')).toBeNull();
  });

  it('opens a validated URL without exposing window.opener', () => {
    const openedWindow = { opener: window } as Window;
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(openedWindow);

    expect(openSafeExternalUrl('https://t.me/antex')).toBe(true);
    expect(openSpy).toHaveBeenCalledWith('https://t.me/antex', '_blank', 'noopener,noreferrer');
    expect(openedWindow.opener).toBeNull();

    openSpy.mockRestore();
  });

  it('does not open a rejected URL', () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);

    expect(openSafeExternalUrl('javascript:alert(1)')).toBe(false);
    expect(openSpy).not.toHaveBeenCalled();

    openSpy.mockRestore();
  });
});
