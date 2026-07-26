import { defineBoot } from '#q-app/wrappers';
import type { Router } from 'vue-router';

import { hasTelegramLaunchParams, resolveBackRouteName } from '@utils/telegram';

const TELEGRAM_SDK_SRC = 'https://telegram.org/js/telegram-web-app.js';
const TELEGRAM_SDK_ID = 'telegram-web-app-sdk';
const TELEGRAM_SDK_TIMEOUT_MS = 5_000;

export interface TelegramMainButton {
  show(): void;
  hide(): void;
  setText(text: string): void;
  onClick(fn: () => void): void;
}

export interface TelegramBackButton {
  show(): void;
  hide(): void;
  onClick(fn: () => void): void;
  offClick(fn: () => void): void;
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
      photo_url?: string;
      is_premium?: boolean;
    };
    start_param?: string;
  };
  ready(): void;
  expand(): void;
  close(): void;
  isVersionAtLeast(version: string): boolean;
  setHeaderColor(color: string): void;
  setBackgroundColor(color: string): void;
  setBottomBarColor(color: string): void;
  BackButton: TelegramBackButton;
  MainButton: TelegramMainButton;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
    TelegramWebviewProxy?: unknown;
    TelegramWebviewProxyProto?: unknown;
    __antexTelegramBackHandler?: () => void;
  }
}

export let tg: TelegramWebApp | undefined =
  typeof window === 'undefined' ? undefined : window.Telegram?.WebApp;

let telegramSdkPromise: Promise<TelegramWebApp | undefined> | null = null;
let telegramReadySent = false;

/** Определяет, запущена ли страница из Telegram client. */
function isTelegramLaunchEnvironment(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return Boolean(
    window.Telegram?.WebApp ||
      window.TelegramWebviewProxy ||
      window.TelegramWebviewProxyProto ||
      hasTelegramLaunchParams(window.location.href),
  );
}

/** Загружает официальный SDK только для Telegram launch и ограничивает ожидание. */
export function loadTelegramSdk(): Promise<TelegramWebApp | undefined> {
  if (typeof window === 'undefined' || !isTelegramLaunchEnvironment()) {
    return Promise.resolve(undefined);
  }

  if (window.Telegram?.WebApp) {
    tg = window.Telegram.WebApp;
    return Promise.resolve(tg);
  }

  if (telegramSdkPromise) {
    return telegramSdkPromise;
  }

  telegramSdkPromise = new Promise((resolve) => {
    const script =
      document.querySelector<HTMLScriptElement>(`script#${TELEGRAM_SDK_ID}`) ??
      document.createElement('script');
    let settled = false;

    /** Завершает SDK startup единожды и возвращает доступный WebApp. */
    const finish = () => {
      if (settled) {
        return;
      }

      settled = true;
      window.clearTimeout(timeoutId);
      tg = window.Telegram?.WebApp;
      resolve(tg);
    };

    const timeoutId = window.setTimeout(finish, TELEGRAM_SDK_TIMEOUT_MS);
    script.addEventListener('load', finish, { once: true });
    script.addEventListener('error', finish, { once: true });

    if (!script.isConnected) {
      script.id = TELEGRAM_SDK_ID;
      script.src = TELEGRAM_SDK_SRC;
      script.async = true;
      document.head.append(script);
    }
  });

  return telegramSdkPromise;
}

/** Синхронизирует native BackButton с актуальным parent route. */
function syncTelegramBackButton(router: Router): void {
  if (!tg) {
    return;
  }

  if (resolveBackRouteName(router.currentRoute.value.meta)) {
    tg.BackButton.show();
    return;
  }

  tg.BackButton.hide();
}

/** Подключает единственный native back handler на время жизни Mini App. */
function configureTelegramBackButton(router: Router): void {
  if (!tg) {
    return;
  }

  if (window.__antexTelegramBackHandler) {
    tg.BackButton.offClick(window.__antexTelegramBackHandler);
  }

  const backHandler = () => {
    const backRouteName = resolveBackRouteName(router.currentRoute.value.meta);
    if (backRouteName) {
      void router.push({ name: backRouteName });
    }
  };

  window.__antexTelegramBackHandler = backHandler;
  tg.BackButton.onClick(backHandler);
  router.afterEach(() => syncTelegramBackButton(router));
  syncTelegramBackButton(router);
}

/** Сообщает Telegram, что обязательная application init завершена. */
export function markTelegramReady(): void {
  if (!tg || telegramReadySent) {
    return;
  }

  telegramReadySent = true;
  tg.ready();
}

export default defineBoot(async ({ router }) => {
  tg = await loadTelegramSdk();
  if (!tg) {
    return;
  }

  tg.expand();
  tg.setHeaderColor('#0F2A26');
  tg.setBackgroundColor('#1B342F');

  if (tg.isVersionAtLeast('7.10')) {
    tg.setBottomBarColor('#1B342F');
  }

  configureTelegramBackButton(router);
});
