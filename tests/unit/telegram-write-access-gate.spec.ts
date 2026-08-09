import { createApp, defineComponent, h, inject, nextTick, provide } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { i18n } from '@i18n';
import TelegramWriteAccessGate from '@components/auth/TelegramWriteAccessGate.vue';

const authStoreMock = {
  writeAccessState: 'auth_error',
  init: vi.fn(),
  requestTelegramWriteAccess: vi.fn(),
};

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

afterEach(() => {
  mountedElement?.remove();
  mountedElement = null;
  vi.clearAllMocks();
});

describe('TelegramWriteAccessGate', () => {
  it('рендерит блокировку и доступные действия вне основного layout', async () => {
    mountedElement = document.createElement('div');
    document.body.append(mountedElement);
    const app = createApp(TelegramWriteAccessGate);
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

    expect(mountedElement.textContent).toContain('Не удалось проверить сессию');
    expect(mountedElement.textContent).toContain('Повторить вход');
    expect(mountedElement.textContent).toContain('Закрыть приложение');

    app.unmount();
  });
});
