import { defineBoot } from '#q-app/wrappers';
import { shallowRef } from 'vue';
import type { Router } from 'vue-router';

import { hasTelegramLaunchParams, resolveBackRouteName } from '@utils/telegram';

const TELEGRAM_SDK_SRC = 'https://telegram.org/js/telegram-web-app.js';
const TELEGRAM_SDK_ID = 'telegram-web-app-sdk';
const TELEGRAM_SDK_TIMEOUT_MS = 5_000;
export const TELEGRAM_SDK_READY_EVENT = 'antex:telegram-sdk-ready';

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
export const telegramWebApp = shallowRef<TelegramWebApp | undefined>(tg);

let telegramSdkPromise: Promise<TelegramWebApp | undefined> | null = null;
let telegramReadySent = false;
let configuredTelegramWebApp: TelegramWebApp | undefined;

/** Публикует доступный WebApp и уведомляет поздних lifecycle consumers. */
function publishTelegramWebApp(webApp: TelegramWebApp): void {
  const becameAvailable = !tg;
  tg = webApp;
  telegramWebApp.value = webApp;

  if (becameAvailable) {
    window.dispatchEvent(new Event(TELEGRAM_SDK_READY_EVENT));
  }
}

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

/** Загружает официальный SDK только для Telegram launch. */
export function loadTelegramSdk(): Promise<TelegramWebApp | undefined> {
  if (typeof window === 'undefined' || !isTelegramLaunchEnvironment()) {
    return Promise.resolve(undefined);
  }

  if (window.Telegram?.WebApp) {
    publishTelegramWebApp(window.Telegram.WebApp);
    return Promise.resolve(tg);
  }

  if (telegramSdkPromise) {
    return telegramSdkPromise;
  }

  telegramSdkPromise = new Promise((resolve) => {
    const script =
      document.querySelector<HTMLScriptElement>(`script#${TELEGRAM_SDK_ID}`) ??
      document.createElement('script');
    let requestSettled = false;
    let bootSettled = false;

    /** Завершает ожидание Quasar boot один раз. */
    const resolveBoot = (webApp: TelegramWebApp | undefined) => {
      if (bootSettled) {
        return;
      }

      bootSettled = true;
      resolve(webApp);
    };

    /** Обрабатывает load, включая позднюю загрузку после timeout. */
    const handleLoad = () => {
      if (requestSettled) {
        return;
      }

      requestSettled = true;
      window.clearTimeout(timeoutId);
      const webApp = window.Telegram?.WebApp;
      if (webApp) {
        publishTelegramWebApp(webApp);
      } else {
        telegramSdkPromise = null;
      }
      resolveBoot(webApp);
    };

    /** Разрешает повторную загрузку после явной ошибки SDK request. */
    const handleError = () => {
      if (requestSettled) {
        return;
      }

      requestSettled = true;
      window.clearTimeout(timeoutId);
      telegramSdkPromise = null;
      script.remove();
      resolveBoot(undefined);
    };

    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });

    const timeoutId = window.setTimeout(() => {
      telegramSdkPromise = null;
      resolveBoot(undefined);
    }, TELEGRAM_SDK_TIMEOUT_MS);

    if (!script.isConnected) {
      script.id = TELEGRAM_SDK_ID;
      script.src = TELEGRAM_SDK_SRC;
      script.async = true;
      document.head.append(script);
    }
  });

  return telegramSdkPromise;
}

/** Настраивает Telegram chrome ровно один раз для текущего WebApp. */
function configureTelegramWebApp(router: Router): void {
  if (!tg || configuredTelegramWebApp === tg) {
    return;
  }

  tg.expand();
  tg.setHeaderColor('#0F2A26');
  tg.setBackgroundColor('#1B342F');

  if (tg.isVersionAtLeast('7.10')) {
    tg.setBottomBarColor('#1B342F');
  }

  configureTelegramBackButton(router);
  configuredTelegramWebApp = tg;
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
  window.addEventListener(TELEGRAM_SDK_READY_EVENT, () => configureTelegramWebApp(router));
  await loadTelegramSdk();
  configureTelegramWebApp(router);
});
