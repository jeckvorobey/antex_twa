import type { ManagerChatMessage, ManagerChatUser } from '@types/manager-chat';

export function managerUserDisplayName(user: ManagerChatUser): string {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  if (fullName) {
    return fullName;
  }
  if (user.username) {
    return `@${user.username}`;
  }
  return `Клиент #${user.id}`;
}

export function managerUserInitials(user: ManagerChatUser): string {
  const parts = [user.firstName, user.lastName].filter(Boolean) as string[];
  if (parts.length) {
    return parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }
  return (user.username?.[0] ?? 'К').toUpperCase();
}

export function managerMessagePreview(message: ManagerChatMessage | null): string {
  if (!message) {
    return 'Диалог готов к сообщению';
  }
  const text = message.text || message.caption;
  if (text) {
    return text;
  }
  switch (message.messageType) {
    case 'photo':
      return 'Фото';
    case 'document':
      return 'Документ';
    case 'voice':
      return 'Голосовое сообщение';
    case 'video':
      return 'Видео';
    default:
      return 'Сообщение';
  }
}

export function managerRelativeTime(value: string | null): string {
  if (!value) {
    return '';
  }
  const time = Date.parse(value);
  if (Number.isNaN(time)) {
    return '';
  }
  const seconds = Math.max(0, Math.floor((Date.now() - time) / 1000));
  if (seconds < 60) {
    return 'сейчас';
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} мин`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} ч`;
  }
  return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit' }).format(time);
}

export function formatManagerAmount(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '—';
  }
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(value);
}

export function receiveMethodLabel(method: string): string {
  switch (method) {
    case 'cash':
      return 'Наличные';
    case 'qrcode':
      return 'QR code';
    case 'bank_account':
      return 'Банк';
    case 'pay_services':
      return 'Оплата услуг';
    default:
      return method;
  }
}

export function formatFileSize(size: number | null): string | null {
  if (!size || size <= 0) {
    return null;
  }
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} КБ`;
  }
  return `${(size / 1024 / 1024).toFixed(size < 10 * 1024 * 1024 ? 1 : 0)} МБ`;
}
