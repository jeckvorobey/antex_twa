import { Notify } from 'quasar';
import type { QNotifyCreateOptions } from 'quasar';

export type AntexNotifyTone = 'positive' | 'negative' | 'warning' | 'info';

export type AntexNotifyCreate = (options: QNotifyCreateOptions) => unknown;

export function useAntexNotify(
  create: AntexNotifyCreate = (options) => Notify.create(options),
) {
  function notify(tone: AntexNotifyTone, message: string): void {
    create({
      type: tone,
      message,
      position: 'bottom',
      timeout: tone === 'negative' ? 4500 : 3000,
      classes: `antex-notify antex-notify--${tone}`,
    });
  }

  return { notify };
}
