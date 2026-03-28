import { createI18n } from 'vue-i18n';

import ru from './ru';

export const DEFAULT_LOCALE = 'ru';
export const SUPPORTED_LOCALES = [DEFAULT_LOCALE] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

function normalizeLocale(locale?: string | null): AppLocale {
  const normalized = locale?.split('-', 1)[0]?.toLowerCase();
  return SUPPORTED_LOCALES.includes(normalized as AppLocale) ? (normalized as AppLocale) : DEFAULT_LOCALE;
}

export const i18n = createI18n({
  legacy: false,
  locale: DEFAULT_LOCALE,
  fallbackLocale: DEFAULT_LOCALE,
  messages: {
    ru,
  },
  globalInjection: true,
});

export function setAppLocale(locale?: string | null) {
  i18n.global.locale.value = normalizeLocale(locale);
}

export { normalizeLocale };
