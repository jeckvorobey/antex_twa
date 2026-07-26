import { defineBoot } from '#q-app/wrappers';

import { markTelegramReady, TELEGRAM_SDK_READY_EVENT, tg } from '@boot/telegram';
import { useAuthStore } from '@stores/auth.store';

export default defineBoot(async () => {
  const authStore = useAuthStore();
  let authInitialization = Promise.resolve();
  let authenticatedInitData: string | null = null;

  /** Сериализует initial и late Telegram auth, не дублируя один initData. */
  const initializeAuth = () => {
    authInitialization = authInitialization.then(async () => {
      const telegramAtStart = tg;
      const initData = telegramAtStart?.initData ?? null;
      if (initData && initData === authenticatedInitData) {
        markTelegramReady();
        return;
      }

      await authStore.init();
      if (initData) {
        authenticatedInitData = initData;
      }

      if (!tg || telegramAtStart === tg) {
        markTelegramReady();
      }
    });

    return authInitialization;
  };

  const initialInitialization = initializeAuth();
  window.addEventListener(TELEGRAM_SDK_READY_EVENT, () => {
    void initializeAuth();
  });
  await initialInitialization;
});
