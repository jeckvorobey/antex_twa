import { createPinia, setActivePinia } from 'pinia';
import { shallowMount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ru from '@i18n/ru';
import ManagerChatsPage from '@pages/manager/ManagerChatsPage.vue';
import { useManagerChatStore } from '@stores/manager-chat.store';
import type { ManagerChatListResponse, ManagerConversation } from '@types/manager-chat';

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

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

import { fetchManagerChats } from '@services/manager-chat';

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
}

/** Создаёт управляемый REST response для проверки component route lifecycle. */
function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

/** Собирает минимальный полный conversation DTO для observable store assertion. */
function makeConversation(id: number): ManagerConversation {
  return {
    id,
    status: 'open',
    unreadCount: 0,
    lastMessageAt: null,
    user: {
      id,
      telegramId: 1000 + id,
      username: `user${id}`,
      firstName: `Клиент ${id}`,
      lastName: null,
      photoUrl: null,
    },
    lastMessage: null,
    latestOrder: null,
  };
}

/** Пропускает async store continuation после разрешения REST response. */
async function flushLifecycleWork(): Promise<void> {
  await Promise.resolve();
  await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
}

describe('ManagerChatsPage route lifecycle', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('P1-3 unmount отменяет list request и поздний response не меняет store', async () => {
    const request = deferred<ManagerChatListResponse>();
    vi.mocked(fetchManagerChats).mockReturnValueOnce(request.promise);
    const store = useManagerChatStore();
    const wrapper = shallowMount(ManagerChatsPage, {
      global: {
        plugins: [createI18n({ legacy: false, locale: 'ru', messages: { ru } })],
        stubs: {
          'q-icon': true,
          'q-input': true,
          'q-page': true,
          'q-spinner': true,
        },
      },
    });
    await vi.waitFor(() => expect(fetchManagerChats).toHaveBeenCalledTimes(1));

    wrapper.unmount();
    request.resolve({ items: [makeConversation(30)], total: 1, unreadTotal: 0 });
    await flushLifecycleWork();

    expect(store.conversations).toEqual([]);
  });
});
