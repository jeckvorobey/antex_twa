import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useManagerChatStore } from '@stores/manager-chat.store';
import {
  sendManagerChatMessage,
  sendManagerChatAttachment,
  forwardManagerChatMessage,
} from '@services/manager-chat';
import type { ManagerChatMessage, ManagerConversation } from '@types/manager-chat';

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
  forwardManagerChatMessage: vi.fn(),
}));

/** Создаёт минимальный валидный диалог для проверки отправки. */
function conversation(id = 1): ManagerConversation {
  return {
    id,
    status: 'open',
    unreadCount: 0,
    lastMessageAt: null,
    lastMessage: null,
    latestOrder: null,
    user: {
      id,
      telegramId: id,
      username: null,
      firstName: 'Клиент',
      lastName: null,
      photoUrl: null,
    },
  };
}

/** Создаёт подтверждённый либо неуспешный ответ API. */
function message(deliveryStatus = 'sent', conversationId = 1): ManagerChatMessage {
  return {
    id: 10,
    conversationId,
    direction: 'outbound',
    messageType: 'text',
    text: 'Привет',
    caption: null,
    deliveryStatus,
    telegramMessageId: 100,
    replyToMessageId: null,
    edited: false,
    createdAt: '2026-09-02T10:00:00Z',
    updatedAt: '2026-09-02T10:00:00Z',
    attachments: [],
  };
}

describe('отправка сообщений менеджером', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.resetAllMocks();
  });

  it('сохраняет ключ при потере HTTP ответа и передаёт выбранный reply', async () => {
    const store = useManagerChatStore();
    store.activeConversation = conversation();
    vi.mocked(sendManagerChatMessage)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(message());
    await expect(store.sendMessage('Привет', 7)).rejects.toThrow();
    await store.sendMessage('Привет', 7);
    const first = vi.mocked(sendManagerChatMessage).mock.calls[0]![1];
    expect(first.replyToMessageId).toBe(7);
    expect(vi.mocked(sendManagerChatMessage).mock.calls[1]![1].clientRequestId).toBe(
      first.clientRequestId,
    );
    await store.sendMessage('Привет', 7);
    expect(vi.mocked(sendManagerChatMessage).mock.calls[2]![1].clientRequestId).not.toBe(
      first.clientRequestId,
    );
  });

  it.each(['failed', 'pending'])('не считает %s подтверждённой отправкой', async (status) => {
    const store = useManagerChatStore();
    store.activeConversation = conversation();
    vi.mocked(sendManagerChatMessage)
      .mockResolvedValueOnce(message(status))
      .mockResolvedValue(message());
    await expect(store.sendMessage('Привет')).rejects.toThrow();
    await store.sendMessage('Привет');
    expect(vi.mocked(sendManagerChatMessage).mock.calls[1]![1].clientRequestId).toBe(
      vi.mocked(sendManagerChatMessage).mock.calls[0]![1].clientRequestId,
    );
  });

  it('передаёт тип кружочка и reply, повторяет тот же файл с тем же ключом', async () => {
    const store = useManagerChatStore();
    store.activeConversation = conversation();
    const file = new File(['video'], 'circle.webm', { type: 'video/webm' });
    vi.mocked(sendManagerChatAttachment)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(message());
    const options = { kind: 'video_note' as const, replyToMessageId: 7 };
    await expect(store.sendAttachment(file, options)).rejects.toThrow();
    await store.sendAttachment(file, options);
    expect(sendManagerChatAttachment).toHaveBeenLastCalledWith(
      1,
      file,
      expect.any(String),
      options,
    );
    expect(vi.mocked(sendManagerChatAttachment).mock.calls[1]![2]).toBe(
      vi.mocked(sendManagerChatAttachment).mock.calls[0]![2],
    );
  });

  it('не вставляет позднее отправленное сообщение в другой диалог', async () => {
    const store = useManagerChatStore();
    store.activeConversation = conversation();
    let resolve!: (value: ManagerChatMessage) => void;
    vi.mocked(sendManagerChatMessage).mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    const sending = store.sendMessage('Привет');
    store.activeConversation = conversation(2);
    store.messages = [];
    resolve(message());
    await sending;
    expect(store.messages).toEqual([]);
    expect(store.activeConversation.id).toBe(2);
  });

  it('пересылает выбранный source в target со стабильным ключом повтора', async () => {
    const store = useManagerChatStore();
    store.activeConversation = conversation();
    vi.mocked(forwardManagerChatMessage)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(message('sent', 2));
    await expect(store.forwardMessage(10, 2)).rejects.toThrow();
    await store.forwardMessage(10, 2);
    expect(forwardManagerChatMessage).toHaveBeenLastCalledWith(2, {
      sourceMessageId: 10,
      clientRequestId: expect.any(String),
    });
    expect(vi.mocked(forwardManagerChatMessage).mock.calls[1]![1].clientRequestId).toBe(
      vi.mocked(forwardManagerChatMessage).mock.calls[0]![1].clientRequestId,
    );
    expect(store.messages).toEqual([]);
  });
});
