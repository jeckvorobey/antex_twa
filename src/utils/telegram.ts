interface TelegramUserIdentity {
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
}

/** Проверяет URL на наличие официальных Telegram Mini App launch parameters. */
export function hasTelegramLaunchParams(url: string): boolean {
  const parsedUrl = new URL(url, 'https://antex.invalid');
  const hashQuery = parsedUrl.hash.includes('?') ? parsedUrl.hash.split('?')[1] : '';
  const hashParams = new URLSearchParams(hashQuery);

  return [parsedUrl.searchParams, hashParams].some(
    (params) => params.has('tgWebAppVersion') || params.has('tgWebAppPlatform'),
  );
}

/** Возвращает непустое имя parent route из route meta. */
export function resolveBackRouteName(meta: Record<string, unknown>): string | null {
  const target = meta.backRouteName;
  return typeof target === 'string' && target.trim() ? target : null;
}

/** Формирует не более двух инициалов Telegram user со стабильным fallback. */
export function getTelegramUserInitials(user?: TelegramUserIdentity | null): string {
  const nameParts = [user?.first_name, user?.last_name].filter(
    (part): part is string => Boolean(part?.trim()),
  );

  if (nameParts.length) {
    return nameParts
      .map((part) => part.trim()[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  const username = user?.username?.trim();
  return (username?.[0] ?? 'A').toUpperCase();
}
