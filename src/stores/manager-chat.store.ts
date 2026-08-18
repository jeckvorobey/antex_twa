import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import {
  closeManagerChat,
  ensureManagerOrderChat,
  fetchManagerChat,
  fetchManagerChatMessages,
  fetchManagerChats,
  fetchManagerOrder,
  fetchManagerOrders,
  markManagerChatRead,
  sendManagerChatAttachment,
  sendManagerChatMessage,
  updateManagerOrderStatus,
} from '@services/manager-chat';
import type {
  ManagerChatMessage,
  ManagerConversation,
  ManagerOrderSummary,
  ManagerRealtimeEnvelope,
} from '@types/manager-chat';

const TERMINAL_ORDER_STATUSES = new Set([3, 4]);

function sortConversations(items: ManagerConversation[]): ManagerConversation[] {
  return [...items].sort((left, right) => {
    const leftTime = left.lastMessageAt ? Date.parse(left.lastMessageAt) : 0;
    const rightTime = right.lastMessageAt ? Date.parse(right.lastMessageAt) : 0;
    return rightTime - leftTime || right.id - left.id;
  });
}

function createClientRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const useManagerChatStore = defineStore('manager-chat', () => {
  const conversations = ref<ManagerConversation[]>([]);
  const total = ref(0);
  const unreadTotal = ref(0);
  const loadingChats = ref(false);
  const chatsLoaded = ref(false);
  const query = ref('');
  const unreadOnly = ref(false);

  const activeConversation = ref<ManagerConversation | null>(null);
  const messages = ref<ManagerChatMessage[]>([]);
  const messagesLoading = ref(false);
  const hasMoreMessages = ref(false);
  const sending = ref(false);

  const orders = ref<ManagerOrderSummary[]>([]);
  const ordersLoading = ref(false);
  const activeOrder = ref<ManagerOrderSummary | null>(null);

  let chatsRequestController: AbortController | null = null;
  let chatsRequestGeneration = 0;
  let activeConversationRequestController: AbortController | null = null;
  let earlierMessagesRequestController: AbortController | null = null;
  let activeConversationGeneration = 0;

  const activeConversationId = computed(() => activeConversation.value?.id ?? null);

  /** Проверяет DTO диалога по фактическим search/unread фильтрам на момент события. */
  function matchesCurrentConversationFilters(conversation: ManagerConversation): boolean {
    if (unreadOnly.value && conversation.unreadCount === 0) {
      return false;
    }
    const search = query.value.trim().toLocaleLowerCase('ru-RU');
    if (!search) {
      return true;
    }
    const user = conversation.user;
    const searchable = [
      user.firstName,
      user.lastName,
      user.username,
      user.username ? `@${user.username}` : null,
    ]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase('ru-RU');
    return searchable.includes(search);
  }

  /** Обновляет active conversation всегда, а список — только по его текущему predicate. */
  function upsertConversation(conversation: ManagerConversation): void {
    if (activeConversation.value?.id === conversation.id) {
      activeConversation.value = conversation;
    }
    const index = conversations.value.findIndex((item) => item.id === conversation.id);
    if (!matchesCurrentConversationFilters(conversation)) {
      if (index !== -1) {
        conversations.value = conversations.value.filter((item) => item.id !== conversation.id);
      }
      return;
    }
    if (index === -1) {
      conversations.value = sortConversations([conversation, ...conversations.value]);
    } else {
      const next = conversations.value.slice();
      next[index] = conversation;
      conversations.value = sortConversations(next);
    }
  }

  /** Применяет unread update и повторно проверяет unread-only predicate списка. */
  function updateConversationUnread(conversationId: number, unreadCount: number): void {
    const conversation = conversations.value.find((item) => item.id === conversationId);
    if (conversation) {
      upsertConversation({ ...conversation, unreadCount });
    }
    if (activeConversation.value?.id === conversationId) {
      activeConversation.value = { ...activeConversation.value, unreadCount };
    }
  }

  function upsertMessage(message: ManagerChatMessage): void {
    if (activeConversation.value?.id !== message.conversationId) {
      return;
    }
    const index = messages.value.findIndex((item) => item.id === message.id);
    if (index === -1) {
      messages.value = [...messages.value, message].sort((a, b) => a.id - b.id);
    } else {
      const next = messages.value.slice();
      next[index] = message;
      messages.value = next;
    }
    if (activeConversation.value) {
      activeConversation.value.lastMessage = message;
      activeConversation.value.lastMessageAt = message.createdAt;
    }
  }

  /** Сохраняет detail snapshot, но исключает terminal заявки из active списка. */
  function upsertOrder(order: ManagerOrderSummary): void {
    if (activeOrder.value?.id === order.id) {
      activeOrder.value = order;
    }
    const index = orders.value.findIndex((item) => item.id === order.id);
    if (TERMINAL_ORDER_STATUSES.has(order.status)) {
      if (index !== -1) {
        orders.value = orders.value.filter((item) => item.id !== order.id);
      }
      return;
    }
    if (index === -1) {
      orders.value = [order, ...orders.value];
    } else {
      const next = orders.value.slice();
      next[index] = order;
      orders.value = next;
    }
  }

  function applySentMessage(message: ManagerChatMessage): void {
    upsertMessage(message);
    const conversation = conversations.value.find((item) => item.id === message.conversationId);
    if (conversation) {
      conversation.lastMessage = message;
      conversation.lastMessageAt = message.createdAt;
      conversations.value = sortConversations(conversations.value);
    }
  }

  /** Загружает список по snapshot фильтров и применяет только последнюю generation. */
  async function loadChats(): Promise<void> {
    chatsRequestController?.abort();
    const controller = new AbortController();
    const generation = ++chatsRequestGeneration;
    chatsRequestController = controller;
    loadingChats.value = true;
    try {
      const search = query.value.trim();
      const response = await fetchManagerChats(
        {
          unreadOnly: unreadOnly.value,
          limit: 100,
          offset: 0,
          ...(search ? { query: search } : {}),
        },
        { signal: controller.signal },
      );
      if (generation !== chatsRequestGeneration || controller.signal.aborted) {
        return;
      }
      conversations.value = sortConversations(response.items);
      total.value = response.total;
      unreadTotal.value = response.unreadTotal;
      chatsLoaded.value = true;
    } catch (error) {
      if (!controller.signal.aborted) {
        throw error;
      }
    } finally {
      if (generation === chatsRequestGeneration) {
        loadingChats.value = false;
      }
      if (chatsRequestController === controller) {
        chatsRequestController = null;
      }
    }
  }

  /** Инвалидирует filtered list request при уходе со страницы списка. */
  function cancelChatsLoad(): void {
    chatsRequestGeneration += 1;
    chatsRequestController?.abort();
    chatsRequestController = null;
    loadingChats.value = false;
  }

  /** Создаёт новую generation active conversation и отменяет её старые REST-запросы. */
  function beginActiveConversationRequest(): {
    controller: AbortController;
    generation: number;
  } {
    activeConversationRequestController?.abort();
    earlierMessagesRequestController?.abort();
    earlierMessagesRequestController = null;
    const controller = new AbortController();
    const generation = ++activeConversationGeneration;
    activeConversationRequestController = controller;
    return { controller, generation };
  }

  /** Отменяет active conversation lifecycle и запрещает позднее применение результатов. */
  function cancelActiveConversationRequests(): void {
    activeConversationGeneration += 1;
    activeConversationRequestController?.abort();
    earlierMessagesRequestController?.abort();
    activeConversationRequestController = null;
    earlierMessagesRequestController = null;
    messagesLoading.value = false;
  }

  /** Сверяет REST state после reconnect, не позволяя route leave вернуть старый диалог. */
  async function reconcile(): Promise<void> {
    await Promise.all([loadChats(), loadOrders()]);
    if (activeConversation.value) {
      const conversationId = activeConversation.value.id;
      const { controller, generation } = beginActiveConversationRequest();
      try {
        const [conversation, response] = await Promise.all([
          fetchManagerChat(conversationId, { signal: controller.signal }),
          fetchManagerChatMessages(conversationId, { limit: 50 }, { signal: controller.signal }),
        ]);
        if (
          generation !== activeConversationGeneration ||
          controller.signal.aborted ||
          activeConversation.value?.id !== conversationId
        ) {
          return;
        }
        activeConversation.value = conversation;
        messages.value = response.items;
        hasMoreMessages.value = response.hasMore;
      } catch (error) {
        if (!controller.signal.aborted) {
          throw error;
        }
      } finally {
        if (activeConversationRequestController === controller) {
          activeConversationRequestController = null;
        }
      }
    }
  }

  /** Открывает диалог только если его request generation всё ещё принадлежит текущему route. */
  async function openConversation(conversationId: number): Promise<void> {
    const { controller, generation } = beginActiveConversationRequest();
    messagesLoading.value = true;
    try {
      const [conversation, response] = await Promise.all([
        fetchManagerChat(conversationId, { signal: controller.signal }),
        fetchManagerChatMessages(conversationId, { limit: 50 }, { signal: controller.signal }),
      ]);
      if (generation !== activeConversationGeneration || controller.signal.aborted) {
        return;
      }
      activeConversation.value = conversation;
      messages.value = response.items;
      hasMoreMessages.value = response.hasMore;
      upsertConversation(conversation);
      if (conversation.unreadCount > 0) {
        await markRead(conversationId);
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        throw error;
      }
    } finally {
      if (generation === activeConversationGeneration) {
        messagesLoading.value = false;
      }
      if (activeConversationRequestController === controller) {
        activeConversationRequestController = null;
      }
    }
  }

  /** Добавляет раннюю страницу сообщений только в тот же active conversation lifecycle. */
  async function loadEarlierMessages(): Promise<void> {
    if (!activeConversation.value || !hasMoreMessages.value || messagesLoading.value) {
      return;
    }
    const firstId = messages.value[0]?.id;
    if (!firstId) {
      return;
    }
    earlierMessagesRequestController?.abort();
    const controller = new AbortController();
    const generation = activeConversationGeneration;
    const conversationId = activeConversation.value.id;
    earlierMessagesRequestController = controller;
    messagesLoading.value = true;
    try {
      const response = await fetchManagerChatMessages(
        conversationId,
        { limit: 50, beforeId: firstId },
        { signal: controller.signal },
      );
      if (
        generation !== activeConversationGeneration ||
        controller.signal.aborted ||
        activeConversation.value?.id !== conversationId
      ) {
        return;
      }
      const existing = new Set(messages.value.map((item) => item.id));
      messages.value = [
        ...response.items.filter((item) => !existing.has(item.id)),
        ...messages.value,
      ];
      hasMoreMessages.value = response.hasMore;
    } catch (error) {
      if (!controller.signal.aborted) {
        throw error;
      }
    } finally {
      if (generation === activeConversationGeneration) {
        messagesLoading.value = false;
      }
      if (earlierMessagesRequestController === controller) {
        earlierMessagesRequestController = null;
      }
    }
  }

  async function sendMessage(text: string): Promise<ManagerChatMessage | null> {
    const conversation = activeConversation.value;
    if (!conversation || !text.trim()) {
      return null;
    }
    sending.value = true;
    try {
      const message = await sendManagerChatMessage(conversation.id, {
        clientRequestId: createClientRequestId(),
        text: text.trim(),
      });
      applySentMessage(message);
      return message;
    } finally {
      sending.value = false;
    }
  }

  async function sendAttachment(file: File): Promise<ManagerChatMessage | null> {
    const conversation = activeConversation.value;
    if (!conversation) {
      return null;
    }
    sending.value = true;
    try {
      const message = await sendManagerChatAttachment(
        conversation.id,
        file,
        createClientRequestId(),
      );
      applySentMessage(message);
      return message;
    } finally {
      sending.value = false;
    }
  }

  async function markRead(conversationId: number): Promise<void> {
    const response = await markManagerChatRead(conversationId);
    updateConversationUnread(conversationId, response.unreadCount);
    unreadTotal.value = response.unreadTotal;
  }

  async function closeConversation(conversationId: number): Promise<void> {
    const conversation = await closeManagerChat(conversationId);
    upsertConversation(conversation);
  }

  async function loadOrders(): Promise<void> {
    ordersLoading.value = true;
    try {
      const response = await fetchManagerOrders();
      orders.value = response.items;
    } finally {
      ordersLoading.value = false;
    }
  }

  async function loadOrder(orderId: number): Promise<void> {
    activeOrder.value = await fetchManagerOrder(orderId);
  }

  async function ensureOrderChat(orderId: number): Promise<ManagerConversation> {
    const conversation = await ensureManagerOrderChat(orderId);
    upsertConversation(conversation);
    return conversation;
  }

  async function changeOrderStatus(orderId: number, status: number): Promise<ManagerOrderSummary> {
    const order = await updateManagerOrderStatus(orderId, status);
    upsertOrder(order);
    const conversation = conversations.value.find(
      (item) => item.latestOrder?.id === order.id || item.user.id === order.user?.id,
    );
    if (conversation) {
      conversation.latestOrder = order;
    }
    return order;
  }

  async function handleRealtimeEvent(event: ManagerRealtimeEnvelope): Promise<void> {
    switch (event.type) {
      case 'realtime.ready': {
        const nextUnread = event.payload.unreadTotal;
        if (typeof nextUnread === 'number') {
          unreadTotal.value = nextUnread;
        }
        return;
      }
      case 'chat.message.created': {
        const message = event.payload.message as unknown as ManagerChatMessage | undefined;
        const conversation = event.payload.conversation as unknown as
          | ManagerConversation
          | undefined;
        const nextUnread = event.payload.unreadTotal;
        if (conversation) {
          upsertConversation(conversation);
        }
        if (message) {
          upsertMessage(message);
        }
        if (typeof nextUnread === 'number') {
          unreadTotal.value = nextUnread;
        }
        if (message && activeConversation.value?.id === message.conversationId) {
          await markRead(message.conversationId);
        }
        return;
      }
      case 'chat.message.updated':
      case 'chat.message.sent':
      case 'chat.message.failed': {
        const message = event.payload.message as unknown as ManagerChatMessage | undefined;
        if (message) {
          applySentMessage(message);
        }
        return;
      }
      case 'chat.read.updated':
      case 'chat.unread.updated': {
        const conversationId = event.payload.conversationId;
        const unreadCount = event.payload.unreadCount;
        const nextUnread = event.payload.unreadTotal;
        if (typeof conversationId === 'number' && typeof unreadCount === 'number') {
          updateConversationUnread(conversationId, unreadCount);
        }
        if (typeof nextUnread === 'number') {
          unreadTotal.value = nextUnread;
        }
        return;
      }
      case 'chat.conversation.updated': {
        const conversation = event.payload.conversation as unknown as
          | ManagerConversation
          | undefined;
        if (conversation) {
          upsertConversation(conversation);
        }
        return;
      }
      case 'chat.order.updated': {
        const order = event.payload.order as unknown as ManagerOrderSummary | undefined;
        const conversationId = event.payload.conversationId;
        if (order) {
          upsertOrder(order);
        }
        if (order && typeof conversationId === 'number') {
          const conversation = conversations.value.find((item) => item.id === conversationId);
          if (conversation) {
            conversation.latestOrder = order;
          }
          if (activeConversation.value?.id === conversationId) {
            activeConversation.value.latestOrder = order;
          }
        }
      }
    }
  }

  /** Сбрасывает route state и инвалидирует все поздние active conversation ответы. */
  function resetActiveConversation(): void {
    cancelActiveConversationRequests();
    activeConversation.value = null;
    messages.value = [];
    hasMoreMessages.value = false;
  }

  return {
    conversations,
    total,
    unreadTotal,
    loadingChats,
    chatsLoaded,
    query,
    unreadOnly,
    activeConversation,
    activeConversationId,
    messages,
    messagesLoading,
    hasMoreMessages,
    sending,
    orders,
    ordersLoading,
    activeOrder,
    loadChats,
    cancelChatsLoad,
    reconcile,
    openConversation,
    loadEarlierMessages,
    sendMessage,
    sendAttachment,
    markRead,
    closeConversation,
    loadOrders,
    loadOrder,
    ensureOrderChat,
    changeOrderStatus,
    handleRealtimeEvent,
    resetActiveConversation,
  };
});
