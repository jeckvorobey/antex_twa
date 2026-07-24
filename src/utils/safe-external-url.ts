/** Возвращает только абсолютный HTTPS URL для media bindings. */
export function toSafeExternalUrl(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Возвращает URL из allowlist внешней навигации: HTTPS или Telegram user deep link.
 */
export function toSafeNavigationUrl(value: string | null | undefined): string | null {
  const httpsUrl = toSafeExternalUrl(value);
  if (httpsUrl) {
    return httpsUrl;
  }

  if (!value) {
    return null;
  }

  try {
    const url = new URL(value.trim());
    const parameterNames = [...url.searchParams.keys()];
    const telegramId = url.searchParams.get('id');
    const isStrictTelegramUserLink =
      url.protocol === 'tg:' &&
      url.hostname === 'user' &&
      url.pathname === '' &&
      !url.username &&
      !url.password &&
      !url.port &&
      !url.hash &&
      parameterNames.length === 1 &&
      parameterNames[0] === 'id' &&
      telegramId !== null &&
      /^[1-9]\d*$/.test(telegramId);

    return isStrictTelegramUserLink ? url.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Открывает проверенный внешний URL без передачи доступа к исходному window.
 */
export function openSafeExternalUrl(value: string | null | undefined): boolean {
  const safeUrl = toSafeNavigationUrl(value);
  if (!safeUrl) {
    return false;
  }

  const openedWindow = window.open(safeUrl, '_blank', 'noopener,noreferrer');
  if (openedWindow) {
    openedWindow.opener = null;
  }

  return true;
}
