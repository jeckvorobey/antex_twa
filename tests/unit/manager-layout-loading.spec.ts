import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';

import ManagerLayout from '@layouts/ManagerLayout.vue';
import { useManagerChatStore } from '@stores/manager-chat.store';
import { useManagerRealtimeStore } from '@stores/manager-realtime.store';

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
