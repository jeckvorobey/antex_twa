import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

    mount(ManagerLayout, {
      global: {
        plugins: [pinia],
        stubs: {
          AppBottomNav: true,
          QLayout: { template: '<main><slot /></main>' },
          QPageContainer: { template: '<section><slot /></section>' },
          RouterView: true,
        },
      },
    });

    expect(loadChats).not.toHaveBeenCalled();
    expect(loadOrders).not.toHaveBeenCalled();
  });
});
