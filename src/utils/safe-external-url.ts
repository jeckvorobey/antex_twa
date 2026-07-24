/**
 * Возвращает только абсолютный HTTPS URL для внешней навигации и media bindings.
 */
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
 * Открывает проверенный внешний URL без передачи доступа к исходному window.
 */
export function openSafeExternalUrl(value: string | null | undefined): boolean {
  const safeUrl = toSafeExternalUrl(value);
  if (!safeUrl) {
    return false;
  }

  const openedWindow = window.open(safeUrl, '_blank', 'noopener,noreferrer');
  if (openedWindow) {
    openedWindow.opener = null;
  }

  return true;
}
