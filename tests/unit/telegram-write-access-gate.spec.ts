import { createApp, defineComponent, h, inject, nextTick, provide, reactive, type App } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tg } from '@boot/telegram';

import { i18n } from '@i18n';
import TelegramWriteAccessGate from '@components/auth/TelegramWriteAccessGate.vue';

const authStoreMock = reactive({
  writeAccessState: 'auth_error',
  init: vi.fn(),
  requestTelegramWriteAccess: vi.fn(),
});

vi.mock('@stores/auth.store', () => ({
  useAuthStore: () => authStoreMock,
}));

const layoutKey = Symbol('test-layout');
const pageContainerKey = Symbol('test-page-container');
const QLayoutContract = defineComponent({
  name: 'QLayout',
  setup(_, { slots }) {
    provide(layoutKey, true);
    return () => h('div', slots.default?.());
  },
});
const QPageContainerContract = defineComponent({
  name: 'QPageContainer',
  setup(_, { slots }) {
    provide(pageContainerKey, true);
    return () => h('div', slots.default?.());
  },
});
const QPageContract = defineComponent({
  name: 'QPage',
  setup(_, { slots }) {
    const hasLayout = inject(layoutKey, false);
    const hasPageContainer = inject(pageContainerKey, false);
    return () => (hasLayout && hasPageContainer ? h('main', slots.default?.()) : null);
  },
});
const QBtnContract = defineComponent({
  name: 'QBtn',
  props: { label: { type: String, default: '' } },
  setup(props) {
    return () => h('button', props.label);
  },
});
const QContainerContract = defineComponent({
  setup(_, { slots }) {
    return () => h('div', slots.default?.());
  },
});

vi.mock('@boot/telegram', () => ({
  tg: { close: vi.fn() },
}));

let mountedElement: HTMLDivElement | null = null;
let mountedApp: App | null = null;

beforeEach(() => {
  authStoreMock.writeAccessState = 'auth_error';
  authStoreMock.init.mockReset();
});

afterEach(() => {
  mountedApp?.unmount();
  mountedApp = null;
  mountedElement?.remove();
  mountedElement = null;
  vi.clearAllMocks();
});

/** Монтирует gate с контрактами Quasar layout, сохраняя реальные click-обработчики. */
async function mountGate() {
  mountedElement = document.createElement('div');
  document.body.append(mountedElement);
  const app = createApp(TelegramWriteAccessGate);
  mountedApp = app;
  app.use(i18n);
  app.component('QLayout', QLayoutContract);
  app.component('QPageContainer', QPageContainerContract);
  app.component('QPage', QPageContract);
  app.component('QBtn', QBtnContract);
  app.component('QAvatar', QContainerContract);
  app.component('QSpinner', QContainerContract);
  app.component('QCard', QContainerContract);
  app.component('QCardSection', QContainerContract);
  app.component('QCardActions', QContainerContract);

  app.mount(mountedElement);
  await nextTick();
}

describe('TelegramWriteAccessGate', () => {
  it('рендерит блокировку и доступные действия вне основного layout', async () => {
    await mountGate();
    expect(mountedElement!.textContent).toContain('Не удалось проверить сессию');
    expect(mountedElement!.textContent).toContain('Повторить вход');
    expect(mountedElement!.textContent).toContain('Закрыть приложение');
  });

  it('для использованного initData предлагает закрыть и открыть приложение, не повторяя login', async () => {
    authStoreMock.writeAccessState = 'reopen_required';
    await mountGate();
    expect(mountedElement!.textContent).toContain('Откройте приложение заново');
    expect(mountedElement!.textContent).toContain('Закройте Mini App');
    const buttons = mountedElement!.querySelectorAll('button');
    expect(buttons).toHaveLength(1);
    buttons[0]!.click();
    expect(tg?.close).toHaveBeenCalledOnce();
    expect(authStoreMock.init).not.toHaveBeenCalled();
    expect(authStoreMock.requestTelegramWriteAccess).not.toHaveBeenCalled();
  });

  it('показывает проверку сессии и убирает повторные клики до завершения запроса', async () => {
    let finish!: () => void;
    authStoreMock.init.mockImplementation(() => {
      authStoreMock.writeAccessState = 'authenticating';
      return new Promise<void>((resolve) => {
        finish = resolve;
      });
    });
    await mountGate();
    mountedElement!.querySelector('button')!.click();
    await nextTick();
    expect(mountedElement!.textContent).toContain('Проверяем сессию');
    expect(mountedElement!.querySelectorAll('button')).toHaveLength(0);
    authStoreMock.writeAccessState = 'reopen_required';
    finish();
    await nextTick();
    expect(authStoreMock.requestTelegramWriteAccess).not.toHaveBeenCalled();
  });

  it('успешный повтор входа продолжает запрос разрешения', async () => {
    authStoreMock.init.mockImplementation(async () => {
      authStoreMock.writeAccessState = 'idle';
    });
    await mountGate();
    mountedElement!.querySelector('button')!.click();
    await nextTick();
    expect(authStoreMock.requestTelegramWriteAccess).toHaveBeenCalledOnce();
  });
});
