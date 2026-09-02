import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';

import ManagerLayout from '@layouts/ManagerLayout.vue';
import { useManagerChatStore } from '@stores/manager-chat.store';
import { useManagerRealtimeStore } from '@stores/manager-realtime.store';
import { useAuthStore } from '@stores/auth.store';

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
    document.body.classList.remove('manager-workspace-active');
    setActivePinia(createPinia());
  });

  it('owns the manager workspace scope without duplicating active page requests', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const chatStore = useManagerChatStore();
    const realtimeStore = useManagerRealtimeStore();
    chatStore.loadingChats = true;
    chatStore.ordersLoading = true;
    const loadChats = vi.spyOn(chatStore, 'loadChats');
    const loadOrders = vi.spyOn(chatStore, 'loadOrders');
    vi.spyOn(realtimeStore, 'start').mockImplementation(() => undefined);
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', name: 'home', component: { template: '<div />' } }],
    });
    await router.push('/');
    await router.isReady();

    const wrapper = mount(ManagerLayout, {
      global: {
        plugins: [pinia, router],
        stubs: {
          AntexBottomNav: true,
          QLayout: { template: '<main><slot /></main>' },
          QPageContainer: { template: '<section><slot /></section>' },
          RouterView: true,
        },
      },
    });

    expect(loadChats).not.toHaveBeenCalled();
    expect(loadOrders).not.toHaveBeenCalled();
    expect(wrapper.find('.app-layout-background').exists()).toBe(true);
    expect(document.body.classList.contains('manager-workspace-active')).toBe(true);

    wrapper.unmount();
    expect(document.body.classList.contains('manager-workspace-active')).toBe(false);
  });
});

it('синхронно очищает состояние при смене пользователя и потере роли', () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  const auth = useAuthStore();
  auth.user = {
    id: 1,
    role: 2,
    username: null,
    phone: null,
    first_name: null,
    last_name: null,
    language_code: 'ru',
    photo_url: null,
    is_bot: false,
    is_premium: false,
    telegram_write_access: true,
    trusted_contact: null,
    trusted_contact_source: null,
    trusted_contact_ready: false,
  };
  const chat = useManagerChatStore();
  const realtime = useManagerRealtimeStore();
  vi.spyOn(chat, 'loadChats').mockResolvedValue();
  vi.spyOn(chat, 'loadOrders').mockResolvedValue();
  vi.spyOn(realtime, 'start').mockImplementation(() => undefined);
  const wrapper = mount(ManagerLayout, {
    global: {
      plugins: [pinia],
      stubs: {
        AntexBottomNav: true,
        RouterView: true,
        QLayout: { template: '<main><slot /></main>' },
        QPageContainer: { template: '<section><slot /></section>' },
      },
    },
  });
  chat.query = 'поиск предыдущего менеджера';
  chat.unreadTotal = 10;
  auth.user = { ...auth.user, phone: '+100000000' };
  expect(chat.query).toBe('поиск предыдущего менеджера');
  expect(chat.unreadTotal).toBe(10);
  auth.user = { ...auth.user, id: 2 };
  expect(chat.query).toBe('');
  expect(chat.unreadTotal).toBe(0);
  chat.query = 'ещё поиск';
  auth.user = { ...auth.user, role: 3 };
  expect(chat.query).toBe('');
  wrapper.unmount();
});
