import { createPinia, setActivePinia } from 'pinia';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mount } from '@vue/test-utils';
import { Quasar } from 'quasar';
import { createI18n } from 'vue-i18n';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ru from '@i18n/ru';
import ManagerLayout from '@layouts/ManagerLayout.vue';
import { useManagerChatStore } from '@stores/manager-chat.store';
import { useManagerRealtimeStore } from '@stores/manager-realtime.store';

const layoutSource = readFileSync(resolve(process.cwd(), 'src/layouts/ManagerLayout.vue'), 'utf8');
const managerStyles = readFileSync(resolve(process.cwd(), 'src/css/manager.scss'), 'utf8');
const readmeSource = readFileSync(resolve(process.cwd(), 'README.md'), 'utf8');

vi.mock('@services/manager-chat', () => ({
  buildManagerSocketUrl: vi.fn(),
  closeManagerChat: vi.fn(),
  ensureManagerOrderChat: vi.fn(),
  fetchManagerChat: vi.fn(),
  fetchManagerChatMessages: vi.fn(),
  fetchManagerChats: vi.fn(),
  fetchManagerOrder: vi.fn(),
  fetchManagerOrders: vi.fn(),
  issueManagerSocketTicket: vi.fn(),
  markManagerChatRead: vi.fn(),
  sendManagerChatAttachment: vi.fn(),
  sendManagerChatMessage: vi.fn(),
  updateManagerOrderStatus: vi.fn(),
}));

describe('ManagerLayout initial loading', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('does not duplicate list requests already started by the active page', () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const chatStore = useManagerChatStore();
    const realtimeStore = useManagerRealtimeStore();
    chatStore.loadingChats = true;
    chatStore.ordersLoading = true;
    const loadChats = vi.spyOn(chatStore, 'loadChats');
    const loadOrders = vi.spyOn(chatStore, 'loadOrders');
    vi.spyOn(realtimeStore, 'start').mockImplementation(() => undefined);
    const stop = vi.spyOn(realtimeStore, 'stop').mockImplementation(() => undefined);

    const wrapper = mount(ManagerLayout, {
      global: {
        plugins: [pinia, Quasar, createI18n({ legacy: false, locale: 'ru', messages: { ru } })],
        stubs: {
          AntexBottomNav: true,
          ManagerNavigation: true,
          QBtn: true,
          QDrawer: { template: '<aside><slot /></aside>' },
          QHeader: { template: '<header><slot /></header>' },
          QLayout: { template: '<main><slot /></main>' },
          QPageContainer: { template: '<section><slot /></section>' },
          QToolbar: { template: '<div><slot /></div>' },
          QToolbarTitle: true,
          RouterView: true,
        },
      },
    });

    expect(loadChats).not.toHaveBeenCalled();
    expect(loadOrders).not.toHaveBeenCalled();

    wrapper.unmount();
    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('uses a Quasar drawer shell and keeps the user bottom navigation out', () => {
    expect(layoutSource).toContain('<q-header');
    expect(layoutSource).toContain('<q-drawer');
    expect(layoutSource).toContain('show-if-above');
    expect(layoutSource).toContain('<ManagerNavigation');
    expect(layoutSource).toContain(':aria-label="t(\'manager.navigation.open\')"');
    expect(layoutSource).toContain('@show="focusNavigation"');
    expect(layoutSource).toContain('@hide="restoreMenuFocus"');
    expect(layoutSource).toContain('ref="menuButtonRef"');
    expect(layoutSource).toContain('ref="navigationRef"');
    expect(layoutSource).not.toContain('AntexBottomNav');
  });

  it('keeps the 320/390 mobile contract and desktop drawer breakpoint explicit', () => {
    expect(layoutSource).toContain('class="manager-mobile-header lt-md"');
    expect(layoutSource).toContain(':breakpoint="1023"');
    expect(layoutSource).toContain('show-if-above');
    expect(managerStyles).toContain('padding-top: var(--antex-safe-area-top);');
    expect(managerStyles).toMatch(/\.manager-navigation-item\s*{[^}]*min-height:\s*48px/s);
    expect(managerStyles).toContain('.manager-navigation-item:focus-visible');
  });

  it('keeps the fixed chat composer clear of the mobile viewport and desktop drawer', () => {
    expect(managerStyles).not.toContain('bottom: calc(88px + var(--antex-safe-area-bottom));');
    expect(managerStyles).not.toContain('padding-bottom: calc(176px + var(--antex-safe-area-bottom));');
    expect(managerStyles).toMatch(
      /\.manager-chat-composer\s*{[^}]*bottom:\s*calc\(16px \+ var\(--antex-safe-area-bottom\)\)/s,
    );
    expect(managerStyles).toMatch(
      /@media \(max-width: 1023px\)\s*{[^}]*\.manager-page\s*{[^}]*padding-top:\s*18px/s,
    );
    expect(managerStyles).toMatch(
      /@media \(min-width: 1024px\)\s*{[^}]*\.manager-chat-composer\s*{[^}]*left:\s*max\(296px,/s,
    );
  });

  it('links the central SSOT through a portable repository URL', () => {
    expect(readmeSource).toContain('https://github.com/jeckvorobey/antex_product');
    expect(readmeSource).not.toContain('](../antex_product/)');
  });
});
