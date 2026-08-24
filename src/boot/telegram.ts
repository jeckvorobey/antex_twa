import { defineBoot } from '#q-app/wrappers';
import { Dark } from 'quasar';

import {
  applyTelegramEnvironment,
  type TelegramEnvironmentWebApp,
} from '@boot/telegram-theme';

export interface TelegramMainButton {
  show(): void;
  hide(): void;
  setText(text: string): void;
  onClick(fn: () => void): void;
}

export type TelegramWriteAccessCallback = (allowed: boolean) => void;

export interface TelegramWebApp extends TelegramEnvironmentWebApp {
  initData: string;
  initDataUnsafe: {
    user?: {
      id?: number;
      username?: string;
      first_name?: string;
      last_name?: string;
      language_code?: string;
      photo_url?: string;
      is_premium?: boolean;
      allows_write_to_pm?: boolean;
    };
    start_param?: string;
  };
  ready(): void;
  expand(): void;
  close(): void;
  requestWriteAccess?: (callback: TelegramWriteAccessCallback) => void;
  MainButton: TelegramMainButton;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

export const tg = window.Telegram?.WebApp;
let cleanupTelegramEnvironment: (() => void) | undefined;

export default defineBoot(() => {
  Dark.set(true);
  cleanupTelegramEnvironment?.();
  cleanupTelegramEnvironment = applyTelegramEnvironment(tg);

  if (!tg) {
    return;
  }

  tg.ready();
  tg.expand();
});
