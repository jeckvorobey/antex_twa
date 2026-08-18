import { api } from '@boot/axios';
import type {
  ManagerChatListResponse,
  ManagerChatMessage,
  ManagerChatMessagesResponse,
  ManagerChatReadResponse,
  ManagerConversation,
  ManagerOrderListResponse,
  ManagerOrderSummary,
  ManagerSocketTicketResponse,
} from '@types/manager-chat';

export interface FetchManagerChatsParams {
  unreadOnly?: boolean;
  query?: string;
  limit?: number;
  offset?: number;
}

const MAX_MANAGER_ATTACHMENT_BYTES = 20 * 1024 * 1024;

/** Загружает список диалогов и позволяет store отменить устаревший фильтрованный запрос. */
export async function fetchManagerChats(
  params: FetchManagerChatsParams = {},
  config: { signal?: AbortSignal } = {},
) {
  const response = await api.get<ManagerChatListResponse>('/api/manager/chats', {
    params,
    ...config,
  });
  return response.data;
}

/** Загружает карточку диалога с поддержкой route-lifecycle cancellation. */
export async function fetchManagerChat(
  conversationId: number,
  config: { signal?: AbortSignal } = {},
) {
  const response = await api.get<ManagerConversation>(
    `/api/manager/chats/${conversationId}`,
    config,
  );
  return response.data;
}

/** Загружает страницу сообщений и не удерживает завершившийся route request. */
export async function fetchManagerChatMessages(
  conversationId: number,
  params: { limit?: number; beforeId?: number } = {},
  config: { signal?: AbortSignal } = {},
) {
  const response = await api.get<ManagerChatMessagesResponse>(
    `/api/manager/chats/${conversationId}/messages`,
    { params, ...config },
  );
  return response.data;
}

export async function sendManagerChatMessage(
  conversationId: number,
  payload: { clientRequestId: string; text: string; replyToMessageId?: number | null },
) {
  const response = await api.post<ManagerChatMessage>(
    `/api/manager/chats/${conversationId}/messages`,
    payload,
  );
  return response.data;
}

function attachmentKind(file: File): 'photo' | 'video' | 'voice' | 'document' {
  if (file.type.startsWith('image/')) {
    return 'photo';
  }
  if (file.type.startsWith('video/')) {
    return 'video';
  }
  if (file.type === 'audio/ogg' || file.type === 'audio/opus') {
    return 'voice';
  }
  return 'document';
}

export async function sendManagerChatAttachment(
  conversationId: number,
  file: File,
  clientRequestId: string,
) {
  if (file.size > MAX_MANAGER_ATTACHMENT_BYTES) {
    throw new Error('Файл больше 20 МБ');
  }
  const response = await api.post<ManagerChatMessage>(
    `/api/manager/chats/${conversationId}/attachments`,
    file,
    {
      params: {
        clientRequestId,
        filename: file.name || 'attachment',
        mimeType: file.type || 'application/octet-stream',
        kind: attachmentKind(file),
      },
      headers: { 'Content-Type': 'application/octet-stream' },
    },
  );
  return response.data;
}

/** Фиксирует read state и позволяет route lifecycle отменить ожидание ответа. */
export async function markManagerChatRead(
  conversationId: number,
  config: { signal?: AbortSignal } = {},
) {
  const response = await api.post<ManagerChatReadResponse>(
    `/api/manager/chats/${conversationId}/read`,
    undefined,
    config,
  );
  return response.data;
}

export async function closeManagerChat(conversationId: number) {
  const response = await api.post<ManagerConversation>(
    `/api/manager/chats/${conversationId}/close`,
  );
  return response.data;
}

/** Загружает active заявки с поддержкой cancellation для reconciliation/page lifecycle. */
export async function fetchManagerOrders(config: { signal?: AbortSignal } = {}) {
  const response = await api.get<ManagerOrderListResponse>('/api/manager/orders', config);
  return response.data;
}

export async function fetchManagerOrder(orderId: number) {
  const response = await api.get<ManagerOrderSummary>(`/api/manager/orders/${orderId}`);
  return response.data;
}

export async function ensureManagerOrderChat(orderId: number) {
  const response = await api.post<ManagerConversation>(`/api/manager/orders/${orderId}/chat`);
  return response.data;
}

export async function updateManagerOrderStatus(orderId: number, status: number) {
  const response = await api.patch<ManagerOrderSummary>(`/api/manager/orders/${orderId}/status`, {
    status,
  });
  return response.data;
}

export async function issueManagerSocketTicket() {
  const response = await api.post<ManagerSocketTicketResponse>('/api/manager/realtime/ticket');
  return response.data;
}

export function buildManagerSocketUrl(ticket: string): string {
  const configuredBase = api.defaults.baseURL || window.location.origin;
  const base = new URL(configuredBase, window.location.origin);
  const socket = new URL('/api/manager/realtime/ws', base.origin);
  socket.protocol = socket.protocol === 'https:' ? 'wss:' : 'ws:';
  socket.searchParams.set('ticket', ticket);
  return socket.toString();
}

export async function fetchManagerAttachment(attachmentId: number): Promise<Blob> {
  const response = await api.get<Blob>(`/api/manager/chat-attachments/${attachmentId}`, {
    responseType: 'blob',
  });
  return response.data;
}
