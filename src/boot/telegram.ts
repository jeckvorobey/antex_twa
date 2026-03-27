import { boot } from 'quasar/wrappers';

declare global {
  interface Window {
    Telegram: { WebApp: TelegramWebApp };
  }
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: Record<string, unknown>;
  ready(): void;
  expand(): void;
  close(): void;
  MainButton: {
    show(): void;
    hide(): void;
    setText(text: string): void;
    onClick(fn: () => void): void;
  };
}

export const tg: TelegramWebApp = window.Telegram?.WebApp;

export default boot(() => {
  if (tg) {
    tg.ready();
    tg.expand();
  }
});
