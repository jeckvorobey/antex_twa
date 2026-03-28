import { boot } from 'quasar/wrappers';

export interface TelegramMainButton {
  show(): void;
  hide(): void;
  setText(text: string): void;
  onClick(fn: () => void): void;
}

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: {
      id?: number;
      username?: string;
      first_name?: string;
      last_name?: string;
      language_code?: string;
      is_premium?: boolean;
    };
  };
  ready(): void;
  expand(): void;
  close(): void;
  MainButton: TelegramMainButton;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

export const tg = window.Telegram?.WebApp;

export default boot(() => {
  if (!tg) {
    return;
  }

  tg.ready();
  tg.expand();
});
