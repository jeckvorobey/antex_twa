import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useManagerChatStore } from '@stores/manager-chat.store';
import { useManagerRealtimeStore } from '@stores/manager-realtime.store';
import type {
  ManagerChatListResponse,
  ManagerChatMessage,
  ManagerConversation,
  ManagerSocketTicketResponse,
} from '@types/manager-chat';

vi.mock('@services/manager-chat', () => ({
  buildManagerSocketUrl: vi.fn((ticket: string) => `ws://manager.test/ws?ticket=${ticket}`),
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

import {
  fetchManagerChats,
  fetchManagerOrders,
  issueManagerSocketTicket,
} from '@services/manager-chat';

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
}

/** Создаёт управляемый Promise для точного порядка ticket и reconciliation. */
function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

/** Собирает полный DTO сообщения для realtime envelope. */
function makeMessage(id: number, conversationId: number): ManagerChatMessage {
  return {
    id,
    conversationId,
    direction: 'inbound',
    messageType: 'text',
    text: `Новое сообщение ${id}`,
    caption: null,
    deliveryStatus: 'received',
    telegramMessageId: id,
    replyToMessageId: null,
    edited: false,
    createdAt: '2026-08-18T12:00:01+00:00',
    updatedAt: '2026-08-18T12:00:01+00:00',
    attachments: [],
  };
}

/** Собирает полный DTO диалога для проверки lost update. */
function makeConversation(id: number): ManagerConversation {
  const message = makeMessage(id, id);
  return {
    id,
    status: 'open',
    unreadCount: 1,
    lastMessageAt: message.createdAt,
    user: {
      id,
      telegramId: 1000 + id,
      username: `user${id}`,
      firstName: `Клиент ${id}`,
      lastName: null,
      photoUrl: null,
    },
    lastMessage: message,
    latestOrder: null,
  };
}

/** Пропускает очередь microtask и один browser task после socket callback. */
async function flushSocketWork(): Promise<void> {
  await Promise.resolve();
  await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
}

class FakeWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 3;
  static instances: FakeWebSocket[] = [];

  readonly sent: string[] = [];
  readyState = FakeWebSocket.OPEN;
  onmessage: ((event: MessageEvent<string>) => unknown) | null = null;
  onerror: ((event: Event) => unknown) | null = null;
  onclose: ((event: CloseEvent) => unknown) | null = null;

  /** Регистрирует transport instance с URL выданного ticket. */
  constructor(readonly url: string) {
    FakeWebSocket.instances.push(this);
  }

  /** Сохраняет исходящий payload без имитации серверной логики. */
  send(payload: string): void {
    this.sent.push(payload);
  }

  /** Закрывает fake transport, не генерируя новый callback автоматически. */
  close(): void {
    this.readyState = FakeWebSocket.CLOSED;
  }

  /** Передаёт серверный envelope через реальный onmessage store handler. */
  emitMessage(payload: Record<string, unknown>): void {
    this.onmessage?.({ data: JSON.stringify(payload) } as MessageEvent<string>);
  }

  /** Вызывает сохранённый error callback старого transport instance. */
  emitError(): void {
    this.onerror?.(new Event('error'));
  }
}

describe('manager realtime ordering and connection generation', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    FakeWebSocket.instances = [];
    vi.stubGlobal('WebSocket', FakeWebSocket);
    vi.mocked(fetchManagerChats).mockResolvedValue({ items: [], total: 0, unreadTotal: 0 });
    vi.mocked(fetchManagerOrders).mockResolvedValue({ items: [] });
  });

  afterEach(() => {
    useManagerRealtimeStore().stop();
    vi.unstubAllGlobals();
  });

  it('TWA-1 применяет following socket event только после ready reconciliation', async () => {
    const realtimeStore = useManagerRealtimeStore();
    const chatStore = useManagerChatStore();
    const reconciliation = deferred<ManagerChatListResponse>();
    vi.mocked(issueManagerSocketTicket).mockResolvedValueOnce({
      ticket: 'ready-ticket',
      expiresInSeconds: 30,
    });
    vi.mocked(fetchManagerChats).mockReturnValueOnce(reconciliation.promise);

    realtimeStore.start();
    await flushSocketWork();
    const socket = FakeWebSocket.instances[0]!;
    socket.emitMessage({ type: 'realtime.ready', payload: { unreadTotal: 0 } });
    await Promise.resolve();
    const conversation = makeConversation(20);
    socket.emitMessage({
      type: 'chat.message.created',
      payload: {
        conversation,
        message: conversation.lastMessage,
        unreadTotal: 1,
      },
    });
    reconciliation.resolve({ items: [], total: 0, unreadTotal: 0 });
    await flushSocketWork();

    expect(chatStore.conversations.map((item) => item.id)).toEqual([20]);
    expect(chatStore.unreadTotal).toBe(1);
  });

  it('TWA-1 не перезаписывает REST unread устаревшим ready snapshot', async () => {
    const realtimeStore = useManagerRealtimeStore();
    const chatStore = useManagerChatStore();
    vi.mocked(issueManagerSocketTicket).mockResolvedValueOnce({
      ticket: 'unread-ticket',
      expiresInSeconds: 30,
    });
    vi.mocked(fetchManagerChats).mockResolvedValueOnce({
      items: [],
      total: 0,
      unreadTotal: 4,
    });

    realtimeStore.start();
    await flushSocketWork();
    FakeWebSocket.instances[0]!.emitMessage({
      type: 'realtime.ready',
      payload: { unreadTotal: 0 },
    });
    await flushSocketWork();

    expect(chatStore.unreadTotal).toBe(4);
  });

  it('P1-1 old ready reconciliation не меняет store после stop/start', async () => {
    const realtimeStore = useManagerRealtimeStore();
    const chatStore = useManagerChatStore();
    const oldChats = deferred<ManagerChatListResponse>();
    const oldOrders = deferred<{ items: [] }>();
    vi.mocked(issueManagerSocketTicket)
      .mockResolvedValueOnce({ ticket: 'old-ready', expiresInSeconds: 30 })
      .mockResolvedValueOnce({ ticket: 'new-session', expiresInSeconds: 30 });
    vi.mocked(fetchManagerChats).mockReturnValueOnce(oldChats.promise);
    vi.mocked(fetchManagerOrders).mockReturnValueOnce(oldOrders.promise);

    realtimeStore.start();
    await flushSocketWork();
    FakeWebSocket.instances[0]!.emitMessage({
      type: 'realtime.ready',
      payload: { unreadTotal: 0 },
    });
    await Promise.resolve();
    realtimeStore.stop();
    realtimeStore.start();
    await flushSocketWork();
    const currentConversation = makeConversation(21);
    await chatStore.handleRealtimeEvent({
      type: 'chat.conversation.updated',
      payload: { conversation: currentConversation },
    });
    await chatStore.handleRealtimeEvent({
      type: 'chat.unread.updated',
      payload: { conversationId: 21, unreadCount: 5, unreadTotal: 5 },
    });

    oldChats.resolve({ items: [makeConversation(22)], total: 1, unreadTotal: 1 });
    oldOrders.resolve({ items: [] });
    await flushSocketWork();

    expect(chatStore.conversations.map((item) => item.id)).toEqual([21]);
    expect(chatStore.unreadTotal).toBe(5);
  });

  it('TWA-10 игнорирует старый ticket после stop/start generation', async () => {
    const realtimeStore = useManagerRealtimeStore();
    const staleTicket = deferred<ManagerSocketTicketResponse>();
    const currentTicket = deferred<ManagerSocketTicketResponse>();
    vi.mocked(issueManagerSocketTicket)
      .mockReturnValueOnce(staleTicket.promise)
      .mockReturnValueOnce(currentTicket.promise);

    realtimeStore.start();
    realtimeStore.stop();
    realtimeStore.start();
    currentTicket.resolve({ ticket: 'current', expiresInSeconds: 30 });
    await flushSocketWork();
    staleTicket.resolve({ ticket: 'stale', expiresInSeconds: 30 });
    await flushSocketWork();

    expect(FakeWebSocket.instances.map((socket) => socket.url)).toEqual([
      'ws://manager.test/ws?ticket=current',
    ]);
  });

  it('TWA-10 игнорирует messages старого socket после новой generation', async () => {
    const realtimeStore = useManagerRealtimeStore();
    const chatStore = useManagerChatStore();
    vi.mocked(issueManagerSocketTicket)
      .mockResolvedValueOnce({ ticket: 'old', expiresInSeconds: 30 })
      .mockResolvedValueOnce({ ticket: 'new', expiresInSeconds: 30 });

    realtimeStore.start();
    await flushSocketWork();
    const oldSocket = FakeWebSocket.instances[0]!;
    realtimeStore.stop();
    realtimeStore.start();
    await flushSocketWork();
    oldSocket.emitMessage({
      type: 'chat.unread.updated',
      payload: { conversationId: 1, unreadCount: 9, unreadTotal: 9 },
    });
    await flushSocketWork();

    expect(chatStore.unreadTotal).toBe(0);
  });

  it('TWA-10 игнорирует error callback старого socket после новой generation', async () => {
    const realtimeStore = useManagerRealtimeStore();
    vi.mocked(issueManagerSocketTicket)
      .mockResolvedValueOnce({ ticket: 'old', expiresInSeconds: 30 })
      .mockResolvedValueOnce({ ticket: 'new', expiresInSeconds: 30 });

    realtimeStore.start();
    await flushSocketWork();
    const oldSocket = FakeWebSocket.instances[0]!;
    realtimeStore.stop();
    realtimeStore.start();
    await flushSocketWork();
    oldSocket.emitError();

    expect(realtimeStore.lastError).toBeNull();
  });
});
