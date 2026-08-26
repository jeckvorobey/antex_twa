import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { QBadge, QIcon, QItem, QItemLabel, QItemSection, QList, Quasar } from 'quasar';
import { createI18n } from 'vue-i18n';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ru from '@i18n/ru';
import { useAuthStore } from '@stores/auth.store';
import { useManagerChatStore } from '@stores/manager-chat.store';

const componentPath = resolve(process.cwd(), 'src/components/manager/ManagerNavigation.vue');
const itemComponentPath = resolve(
  process.cwd(),
  'src/components/manager/ManagerNavigationItem.vue',
);

const { routeHarness, routerPush } = vi.hoisted(() => ({
  routeHarness: { current: { name: 'managerOrder' as string | null } },
  routerPush: vi.fn(),
}));

vi.mock('vue-router', async () => {
  const { reactive } = await import('vue');
  routeHarness.current = reactive(routeHarness.current);
  return {
    useRoute: () => routeHarness.current,
    useRouter: () => ({ push: routerPush }),
  };
});

vi.mock('@services/manager-chat', () => ({
  closeManagerChat: vi.fn(),
  ensureManagerOrderChat: vi.fn(),
  fetchManagerChat: vi.fn(),
  fetchManagerChatMessages: vi.fn(),
  fetchManagerChats: vi.fn(),
  fetchManagerOrder: vi.fn(),
  fetchManagerOrders: vi.fn(),
  markManagerChatRead: vi.fn(),
  sendManagerChatAttachment: vi.fn(),
  sendManagerChatMessage: vi.fn(),
  updateManagerOrderStatus: vi.fn(),
}));

describe('ManagerNavigation', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    routerPush.mockReset();
    routeHarness.current.name = 'managerOrder';
  });

  it('renders localized manager items, detail active state and capped unread badge', async () => {
    expect(existsSync(componentPath)).toBe(true);
    expect(existsSync(itemComponentPath)).toBe(true);

    const { default: ManagerNavigation } = await import(/* @vite-ignore */ componentPath);
    const pinia = createPinia();
    setActivePinia(pinia);
    const authStore = useAuthStore();
    const chatStore = useManagerChatStore();
    authStore.user = {
      id: 2,
      username: 'manager',
      phone: null,
      first_name: 'Иван',
      last_name: null,
      language_code: 'ru',
      photo_url: null,
      is_bot: false,
      is_premium: false,
      telegram_write_access: true,
      role: 2,
      trusted_contact: 'manager',
      trusted_contact_source: 'username',
      trusted_contact_ready: true,
      navigation: [
        {
          name: 'managerDashboard',
          label: 'Dashboard',
          icon: 'space_dashboard',
          route: 'managerDashboard',
        },
        { name: 'managerOrders', label: 'Orders', icon: 'receipt_long', route: 'managerOrders' },
        {
          name: 'managerChats',
          label: 'Chats',
          icon: 'chat_bubble_outline',
          route: 'managerChats',
          badge_key: 'unread_chats',
        },
        { name: 'managerSettings', label: 'Settings', icon: 'settings', route: 'managerProfile' },
      ],
    };
    chatStore.unreadTotal = 140;

    const wrapper = mount(ManagerNavigation, {
      attachTo: document.body,
      global: {
        plugins: [pinia, Quasar, createI18n({ legacy: false, locale: 'ru', messages: { ru } })],
        components: { QBadge, QIcon, QItem, QItemLabel, QItemSection, QList },
      },
    });

    const items = wrapper.findAll('.manager-navigation-item');
    expect(items).toHaveLength(4);
    expect(wrapper.findAllComponents(QItemLabel).map((item) => item.text())).toEqual([
      'Дашборд',
      'Заявки',
      'Чаты',
      'Настройки',
    ]);
    expect(wrapper.get('.manager-navigation-item__badge').text()).toBe('99+');
    expect(wrapper.get('[data-navigation-name="managerOrders"]').attributes('aria-current')).toBe(
      'page',
    );
    expect(
      wrapper.get('[data-navigation-name="managerChats"]').attributes('aria-current'),
    ).toBeUndefined();

    routeHarness.current.name = 'managerChat';
    await wrapper.vm.$nextTick();
    expect(wrapper.get('[data-navigation-name="managerChats"]').attributes('aria-current')).toBe(
      'page',
    );

    (wrapper.vm as unknown as { focusFirst: () => void }).focusFirst();
    expect(document.activeElement).toBe(items[0]!.element);
    wrapper.unmount();
  });

  it('pushes one route and emits navigate once', async () => {
    expect(existsSync(componentPath)).toBe(true);
    const { default: ManagerNavigation } = await import(/* @vite-ignore */ componentPath);
    const pinia = createPinia();
    setActivePinia(pinia);

    const wrapper = mount(ManagerNavigation, {
      global: {
        plugins: [pinia, Quasar, createI18n({ legacy: false, locale: 'ru', messages: { ru } })],
        components: { QBadge, QIcon, QItem, QItemLabel, QItemSection, QList },
      },
    });

    await wrapper.get('[data-navigation-name="managerDashboard"]').trigger('click');

    expect(routerPush).toHaveBeenCalledTimes(1);
    expect(routerPush).toHaveBeenCalledWith({ name: 'managerDashboard' });
    expect(wrapper.emitted('navigate')).toHaveLength(1);
  });
});
