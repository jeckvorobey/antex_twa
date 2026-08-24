import type { ManagerChatMessage, ManagerChatUser } from '@types/manager-chat';

type ManagerTranslate = (key: string, named?: Record<string, unknown>) => string;

export function managerUserFullName(user: ManagerChatUser): string | null {
  return [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || null;
}

export function managerUserDisplayName(user: ManagerChatUser, fallback: string): string {
  const fullName = managerUserFullName(user);
  if (fullName) {
    return fullName;
  }
  if (user.username) {
    return `@${user.username}`;
  }
  return fallback;
}

export function managerCurrencyMark(currency: string): string {
  const marks: Record<string, string> = {
    RUB: '🇷🇺',
    THB: '🇹🇭',
    GEL: '🇬🇪',
    VND: '🇻🇳',
    USDT: 'USDT',
  };
  return marks[currency.toUpperCase()] ?? currency;
}

export function managerUserInitials(user: ManagerChatUser): string {
  const parts = [user.firstName, user.lastName].filter(Boolean) as string[];
  if (parts.length) {
    return parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }
  return (user.username?.[0] ?? '?').toUpperCase();
}

export function managerMessagePreview(
  message: ManagerChatMessage | null,
  t: ManagerTranslate,
): string {
  if (!message) {
    return t('manager.chat.preview.ready');
  }
  const text = message.text || message.caption;
  if (text) {
    return text;
  }
  switch (message.messageType) {
    case 'photo':
      return t('manager.chat.preview.photo');
    case 'document':
      return t('manager.chat.preview.document');
    case 'voice':
      return t('manager.chat.preview.voice');
    case 'video':
      return t('manager.chat.preview.video');
    default:
      return t('manager.chat.preview.message');
  }
}

export function managerRelativeTime(
  value: string | null,
  t: ManagerTranslate,
  locale: string,
): string {
  if (!value) {
    return '';
  }
  const time = Date.parse(value);
  if (Number.isNaN(time)) {
    return '';
  }
  const seconds = Math.max(0, Math.floor((Date.now() - time) / 1000));
  if (seconds < 60) {
    return t('manager.relativeTime.now');
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return t('manager.relativeTime.minutes', { count: minutes });
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return t('manager.relativeTime.hours', { count: hours });
  }
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit' }).format(time);
}

export function formatManagerAmount(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '—';
  }
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(value);
}

export function formatFileSize(
  size: number | null,
  units: { kilobyte: string; megabyte: string },
): string | null {
  if (!size || size <= 0) {
    return null;
  }
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} ${units.kilobyte}`;
  }
  return `${(size / 1024 / 1024).toFixed(size < 10 * 1024 * 1024 ? 1 : 0)} ${units.megabyte}`;
}
