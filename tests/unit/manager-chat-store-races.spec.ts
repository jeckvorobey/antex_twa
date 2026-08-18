import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useManagerChatStore } from '@stores/manager-chat.store';
import type {
  ManagerChatListResponse,
  ManagerChatMessage,
  ManagerChatMessagesResponse,
  ManagerConversation,
  ManagerOrderListResponse,
  ManagerOrderSummary,
} from '@types/manager-chat';

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

import {
  fetchManagerChat,
  fetchManagerChatMessages,
  fetchManagerChats,
  fetchManagerOrders,
} from '@services/manager-chat';

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
}

/** Создаёт управляемый Promise для воспроизведения обратного порядка REST-ответов. */
function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

/** Собирает полный DTO сообщения с предсказуемыми значениями для reducer-тестов. */
function makeMessage(id: number, conversationId: number): ManagerChatMessage {
  return {
    id,
    conversationId,
    direction: 'inbound',
    messageType: 'text',
    text: `Сообщение ${id}`,
    caption: null,
    deliveryStatus: 'received',
    telegramMessageId: id,
    replyToMessageId: null,
    edited: false,
    createdAt: `2026-08-18T12:00:${String(id).padStart(2, '0')}+00:00`,
    updatedAt: `2026-08-18T12:00:${String(id).padStart(2, '0')}+00:00`,
    attachments: [],
  };
}

/** Собирает полный DTO диалога, меняя только значимые для сценария поля. */
function makeConversation(
  id: number,
  params: { firstName?: string; username?: string; unreadCount?: number } = {},
): ManagerConversation {
  const message = makeMessage(id, id);
  return {
    id,
    status: 'open',
    unreadCount: params.unreadCount ?? 0,
    lastMessageAt: message.createdAt,
    user: {
      id,
      telegramId: 1000 + id,
      username: params.username ?? `user${id}`,
      firstName: params.firstName ?? `Клиент ${id}`,
      lastName: null,
      photoUrl: null,
    },
    lastMessage: message,
    latestOrder: null,
  };
}

/** Собирает DTO заявки с указанным operational status. */
function makeOrder(id: number, status: number): ManagerOrderSummary {
  return {
    id,
    publicNumber: `202608${String(id).padStart(4, '0')}`,
    currencySell: 'RUB',
    amountSell: 10_000,
    currencyBuy: 'THB',
    amountBuy: 4_000,
    status,
    methodGet: 'cash',
    createdAt: '2026-08-18T12:00:00+00:00',
  };
}

/** Оборачивает список диалогов в полный REST-ответ. */
function makeChatList(items: ManagerConversation[]): ManagerChatListResponse {
  return {
    items,
    total: items.length,
    unreadTotal: items.reduce((total, item) => total + item.unreadCount, 0),
  };
}

describe('manager chat store request races', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('TWA-2 не применяет ответ active conversation после ухода с маршрута', async () => {
    const store = useManagerChatStore();
    const conversationRequest = deferred<ManagerConversation>();
    const messagesRequest = deferred<ManagerChatMessagesResponse>();
    vi.mocked(fetchManagerChat).mockReturnValueOnce(conversationRequest.promise);
    vi.mocked(fetchManagerChatMessages).mockReturnValueOnce(messagesRequest.promise);

    const opening = store.openConversation(10);
    store.resetActiveConversation();
    conversationRequest.resolve(makeConversation(10));
    messagesRequest.resolve({ items: [makeMessage(100, 10)], hasMore: false });
    await opening;

    expect(store.activeConversation).toBeNull();
    expect(store.messages).toEqual([]);
    expect(fetchManagerChat).toHaveBeenCalledWith(
      10,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('TWA-4 применяет только последний ответ для текущего search-фильтра', async () => {
    const store = useManagerChatStore();
    const staleRequest = deferred<ManagerChatListResponse>();
    const currentRequest = deferred<ManagerChatListResponse>();
    vi.mocked(fetchManagerChats)
      .mockReturnValueOnce(staleRequest.promise)
      .mockReturnValueOnce(currentRequest.promise);

    store.query = 'старый';
    const staleLoad = store.loadChats();
    store.query = 'текущий';
    const currentLoad = store.loadChats();
    currentRequest.resolve(makeChatList([makeConversation(2, { firstName: 'Текущий' })]));
    await currentLoad;
    staleRequest.resolve(makeChatList([makeConversation(1, { firstName: 'Старый' })]));
    await staleLoad;

    expect(store.conversations.map((item) => item.id)).toEqual([2]);
  });

  it('TWA-4 отменяет filtered list request после ухода с маршрута', async () => {
    const store = useManagerChatStore();
    const request = deferred<ManagerChatListResponse>();
    vi.mocked(fetchManagerChats).mockReturnValueOnce(request.promise);

    const loading = store.loadChats();
    const lifecycleStore = store as typeof store & { cancelChatsLoad?: () => void };
    lifecycleStore.cancelChatsLoad?.();
    request.resolve(makeChatList([makeConversation(3)]));
    await loading;

    expect(store.conversations).toEqual([]);
    expect(fetchManagerChats).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });
});

describe('manager chat store realtime filters', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('TWA-6 не вставляет realtime-диалог мимо текущего search predicate', async () => {
    const store = useManagerChatStore();
    store.query = 'иван';

    await store.handleRealtimeEvent({
      type: 'chat.conversation.updated',
      payload: { conversation: makeConversation(4, { firstName: 'Пётр' }) },
    });

    expect(store.conversations).toEqual([]);
  });

  it('TWA-6 удаляет прочитанный realtime-диалог из unread-only списка', async () => {
    const store = useManagerChatStore();
    store.unreadOnly = true;
    vi.mocked(fetchManagerChats).mockResolvedValueOnce(
      makeChatList([makeConversation(5, { unreadCount: 2 })]),
    );
    await store.loadChats();

    await store.handleRealtimeEvent({
      type: 'chat.read.updated',
      payload: { conversationId: 5, unreadCount: 0, unreadTotal: 0 },
    });

    expect(store.conversations).toEqual([]);
  });

  it('TWA-6 не вставляет прочитанный realtime-диалог в unread-only список', async () => {
    const store = useManagerChatStore();
    store.unreadOnly = true;

    await store.handleRealtimeEvent({
      type: 'chat.conversation.updated',
      payload: { conversation: makeConversation(6, { unreadCount: 0 }) },
    });

    expect(store.conversations).toEqual([]);
  });
});

describe('manager active orders realtime reducer', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('TWA-11 удаляет существующую заявку после terminal status event', async () => {
    const store = useManagerChatStore();
    const response: ManagerOrderListResponse = { items: [makeOrder(7, 2)] };
    vi.mocked(fetchManagerOrders).mockResolvedValueOnce(response);
    await store.loadOrders();

    await store.handleRealtimeEvent({
      type: 'chat.order.updated',
      payload: { order: makeOrder(7, 3) },
    });

    expect(store.orders).toEqual([]);
  });

  it('TWA-11 не вставляет отсутствующую заявку с terminal status', async () => {
    const store = useManagerChatStore();

    await store.handleRealtimeEvent({
      type: 'chat.order.updated',
      payload: { order: makeOrder(8, 4) },
    });

    expect(store.orders).toEqual([]);
  });
});
