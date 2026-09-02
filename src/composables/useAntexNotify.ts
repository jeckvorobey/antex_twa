import { Notify } from 'quasar';
import type { QNotifyCreateOptions } from 'quasar';
import { i18n } from '@i18n';

export type AntexNotifyTone = 'positive' | 'negative' | 'warning' | 'info';

export type AntexNotifyCreate = (options: QNotifyCreateOptions) => unknown;

const icons: Record<AntexNotifyTone, string> = {
  positive: 'check_circle_outline',
  negative: 'error_outline',
  warning: 'warning_amber',
  info: 'info_outline',
};

/** Показывает общий верхний стек уведомлений клиента и менеджера в стиле AntEx. */
export function useAntexNotify(create: AntexNotifyCreate = (options) => Notify.create(options)) {
  /** Сохраняет системные роли и локализованное закрытие без HTML из сообщения. */
  function notify(tone: AntexNotifyTone, message: string): void {
    create({
      type: tone,
      message,
      position: 'top',
      // Убираем bg-*/text-* из стандартного type: они перекрывают фирменную поверхность.
      color: undefined,
      textColor: undefined,
      icon: icons[tone],
      html: false,
      attrs: { role: tone === 'negative' ? 'alert' : 'status' },
      actions: [
        {
          icon: 'close',
          round: true,
          dense: true,
          'aria-label': i18n.global.t('common.close'),
        },
      ],
      timeout: tone === 'negative' ? 4500 : 3000,
      classes: `antex-notify antex-notify--${tone}`,
    });
  }

  return { notify };
}
