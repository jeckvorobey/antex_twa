import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  applyTelegramEnvironment,
  resolveTelegramPlatform,
  type TelegramEnvironmentWebApp,
} from '@boot/telegram-theme';

function makeWebApp(overrides: Partial<TelegramEnvironmentWebApp> = {}) {
  const listeners = new Map<string, () => void>();
  const webApp: TelegramEnvironmentWebApp = {
    platform: 'ios',
    colorScheme: 'light',
    themeParams: { bg_color: '#ffffff' },
    onEvent: vi.fn((event, listener) => listeners.set(event, listener)),
    offEvent: vi.fn((event, listener) => {
      if (listeners.get(event) === listener) listeners.delete(event);
    }),
    setHeaderColor: vi.fn(),
    setBackgroundColor: vi.fn(),
    setBottomBarColor: vi.fn(),
    ...overrides,
  };
  return { webApp, listeners };
}

afterEach(() => {
  document.documentElement.removeAttribute('data-antex-platform');
  document.documentElement.removeAttribute('data-antex-telegram-scheme');
  document.documentElement.classList.remove('antex-theme--adaptive-dark');
  document.body.classList.remove('body--dark');
  document.querySelector('meta[name="theme-color"]')?.remove();
});

describe('Telegram adaptive-dark environment', () => {
  it.each([
    ['ios', 'ios'],
    ['android', 'android'],
    ['android_x', 'android'],
    ['tdesktop', 'desktop'],
    ['macos', 'desktop'],
    ['weba', 'web'],
    ['webk', 'web'],
    ['unexpected', 'unknown'],
    [undefined, 'unknown'],
  ] as const)('normalizes platform %s to %s', (input, expected) => {
    expect(resolveTelegramPlatform(input)).toBe(expected);
  });

  it('keeps the product dark when Telegram chrome reports a light scheme', () => {
    const { webApp } = makeWebApp();

    const cleanup = applyTelegramEnvironment(webApp);

    expect(document.documentElement.dataset.antexPlatform).toBe('ios');
    expect(document.documentElement.dataset.antexTelegramScheme).toBe('light');
    expect(document.documentElement.classList).toContain('antex-theme--adaptive-dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
    expect(document.body.classList).toContain('body--dark');
    expect(webApp.setHeaderColor).toHaveBeenCalledWith('#0F2A26');
    expect(webApp.setBackgroundColor).toHaveBeenCalledWith('#0F2A26');
    expect(webApp.setBottomBarColor).toHaveBeenCalledWith('#0F2A26');
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe(
      '#0F2A26',
    );

    cleanup();
  });

  it('updates environment metadata on Telegram events and removes every listener', () => {
    const { webApp, listeners } = makeWebApp();
    const cleanup = applyTelegramEnvironment(webApp);

    webApp.colorScheme = 'dark';
    webApp.platform = 'android_x';
    listeners.get('themeChanged')?.();
    listeners.get('safeAreaChanged')?.();
    listeners.get('contentSafeAreaChanged')?.();

    expect(document.documentElement.dataset.antexTelegramScheme).toBe('dark');
    expect(document.documentElement.dataset.antexPlatform).toBe('android');
    expect(document.documentElement.style.colorScheme).toBe('dark');
    expect(webApp.onEvent).toHaveBeenCalledTimes(3);

    cleanup();

    expect(webApp.offEvent).toHaveBeenCalledTimes(3);
    expect(listeners.size).toBe(0);
  });
});
