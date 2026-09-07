import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, expect, it, vi } from 'vitest';

import { useManagerChatStore } from '@stores/manager-chat.store';
import type { ManagerChatMessage, ManagerConversation } from '@types/manager-chat';

vi.mock('@services/manager-chat', () => ({
  closeManagerChat: vi.fn(),
  ensureManagerOrderChat: vi.fn(),
  fetchManagerChat: vi.fn(),
  fetchManagerChatMessages: vi.fn(),
  fetchManagerChats: vi.fn(),
  fetchManagerOrder: vi.fn(),
  fetchManagerOrders: vi.fn(),
  forwardManagerChatMessage: vi.fn(),
  markManagerChatRead: vi.fn(),
  sendManagerChatAttachment: vi.fn(),
  sendManagerChatMessage: vi.fn(),
  updateManagerOrderStatus: vi.fn(),
}));

import { fetchManagerChats, sendManagerChatMessage } from '@services/manager-chat';

const oldMessage: ManagerChatMessage = {
  id: 1,
  conversationId: 1,
  direction: 'outbound',
  messageType: 'text',
  text: 'История первого менеджера',
  caption: null,
  deliveryStatus: 'sent',
  telegramMessageId: 1,
  replyToMessageId: null,
  edited: false,
  createdAt: '2026-09-02T00:00:00Z',
  updatedAt: '2026-09-02T00:00:00Z',
  attachments: [],
};
const oldConversation: ManagerConversation = {
  id: 1,
  status: 'open',
  unreadCount: 1,
  lastMessageAt: oldMessage.createdAt,
  user: {
    id: 3,
    telegramId: 333,
    username: null,
    firstName: 'Клиент',
    lastName: null,
    photoUrl: null,
  },
  lastMessage: oldMessage,
  latestOrder: null,
};

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
});

it('удаляет историю, фильтры и счётчики предыдущей сессии', () => {
  const store = useManagerChatStore();
  store.conversations = [oldConversation];
  store.activeConversation = oldConversation;
  store.messages = [oldMessage];
  store.unreadTotal = 7;
  store.query = 'секретный поиск';
  store.chatsLoaded = true;
  store.resetSession();
  expect(store.conversations).toEqual([]);
  expect(store.activeConversation).toBeNull();
  expect(store.messages).toEqual([]);
  expect(store.unreadTotal).toBe(0);
  expect(store.query).toBe('');
  expect(store.chatsLoaded).toBe(false);
});

it('игнорирует позднюю загрузку списка после смены сессии', async () => {
  const store = useManagerChatStore();
  let resolve!: (value: {
    items: ManagerConversation[];
    total: number;
    unreadTotal: number;
  }) => void;
  vi.mocked(fetchManagerChats).mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  const request = store.loadChats();
  store.resetSession();
  resolve({ items: [oldConversation], total: 1, unreadTotal: 1 });
  await request;
  expect(store.conversations).toEqual([]);
  expect(store.unreadTotal).toBe(0);
});

it('не возвращает старую отправку в новую сессию и не сбрасывает её sending', async () => {
  const store = useManagerChatStore();
  store.activeConversation = oldConversation;
  let resolve!: (value: ManagerChatMessage) => void;
  vi.mocked(sendManagerChatMessage).mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  const request = store.sendMessage('Ответ');
  store.resetSession();
  store.sending = true;
  resolve(oldMessage);
  expect(await request).toBeNull();
  expect(store.conversations).toEqual([]);
  expect(store.messages).toEqual([]);
  expect(store.sending).toBe(true);
});
