export type TelegramPlatform =
  | 'android'
  | 'android_x'
  | 'ios'
  | 'macos'
  | 'tdesktop'
  | 'weba'
  | 'webk'
  | 'unknown';

export type AntexPlatform = 'ios' | 'android' | 'desktop' | 'web' | 'unknown';
export type TelegramEnvironmentEvent =
  | 'themeChanged'
  | 'safeAreaChanged'
  | 'contentSafeAreaChanged';

export interface TelegramEnvironmentWebApp {
  platform?: TelegramPlatform | string;
  colorScheme?: 'light' | 'dark' | string;
  themeParams?: Record<string, string | undefined>;
  onEvent?: (event: TelegramEnvironmentEvent, listener: () => void) => void;
  offEvent?: (event: TelegramEnvironmentEvent, listener: () => void) => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  setBottomBarColor?: (color: string) => void;
}

const ANTEX_NATIVE_SURFACE = '#0F2A26';
const ENVIRONMENT_EVENTS: TelegramEnvironmentEvent[] = [
  'themeChanged',
  'safeAreaChanged',
  'contentSafeAreaChanged',
];

export function resolveTelegramPlatform(platform?: string): AntexPlatform {
  if (platform === 'ios') return 'ios';
  if (platform === 'android' || platform === 'android_x') return 'android';
  if (platform === 'macos' || platform === 'tdesktop') return 'desktop';
  if (platform === 'weba' || platform === 'webk') return 'web';
  return 'unknown';
}

function syncNativeChrome(webApp: TelegramEnvironmentWebApp): void {
  webApp.setHeaderColor?.(ANTEX_NATIVE_SURFACE);
  webApp.setBackgroundColor?.(ANTEX_NATIVE_SURFACE);
  webApp.setBottomBarColor?.(ANTEX_NATIVE_SURFACE);

  if (typeof document === 'undefined') return;
  let themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!themeMeta) {
    themeMeta = document.createElement('meta');
    themeMeta.name = 'theme-color';
    document.head.appendChild(themeMeta);
  }
  themeMeta.content = ANTEX_NATIVE_SURFACE;
}

export function applyTelegramEnvironment(
  webApp: TelegramEnvironmentWebApp | undefined,
  root: HTMLElement | undefined =
    typeof document === 'undefined' ? undefined : document.documentElement,
): () => void {
  if (!root) return () => undefined;

  const sync = () => {
    root.dataset.antexPlatform = resolveTelegramPlatform(webApp?.platform);
    root.dataset.antexTelegramScheme = webApp?.colorScheme === 'dark' ? 'dark' : 'light';
    root.classList.add('antex-theme--adaptive-dark');
    root.style.colorScheme = 'dark';
    if (typeof document !== 'undefined') document.body.classList.add('body--dark');
    if (webApp) syncNativeChrome(webApp);
  };

  sync();
  for (const event of ENVIRONMENT_EVENTS) webApp?.onEvent?.(event, sync);

  return () => {
    for (const event of ENVIRONMENT_EVENTS) webApp?.offEvent?.(event, sync);
  };
}
