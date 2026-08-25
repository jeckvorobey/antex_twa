export interface ManagerChatUser {
  id: number;
  telegramId: number | null;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
}

export interface ManagerOrderCity {
  id: number;
  name: string;
  country: string;
  countryRuName: string;
  countryCode: string;
  countryFlag: string;
}

export interface ManagerOrderSummary {
  id: number;
  publicNumber: string;
  currencySell: string;
  amountSell: number;
  currencyBuy: string;
  amountBuy: number | null;
  rate: number | null;
  rateDisplay: string | null;
  rateText: string | null;
  country: string;
  city: ManagerOrderCity | null;
  status: number;
  methodGet: string;
  createdAt: string;
  user?: ManagerChatUser | null;
}

export interface ChatAttachment {
  id: number;
  kind: string;
  fileId: string;
  fileUniqueId: string | null;
  filename: string | null;
  mimeType: string | null;
  size: number | null;
}

export interface ManagerChatMessage {
  id: number;
  conversationId: number;
  direction: 'inbound' | 'outbound';
  messageType: string;
  text: string | null;
  caption: string | null;
  deliveryStatus: 'received' | 'pending' | 'sent' | 'failed' | string;
  telegramMessageId: number | null;
  replyToMessageId: number | null;
  edited: boolean;
  createdAt: string;
  updatedAt: string;
  attachments: ChatAttachment[];
}

export interface ManagerConversation {
  id: number;
  status: string;
  unreadCount: number;
  lastMessageAt: string | null;
  user: ManagerChatUser;
  lastMessage: ManagerChatMessage | null;
  latestOrder: ManagerOrderSummary | null;
}

export interface ManagerChatListResponse {
  items: ManagerConversation[];
  total: number;
  unreadTotal: number;
}

export interface ManagerChatMessagesResponse {
  items: ManagerChatMessage[];
  hasMore: boolean;
}

export interface ManagerChatReadResponse {
  conversationId: number;
  unreadCount: number;
  unreadTotal: number;
}

export interface ManagerOrderListResponse {
  items: ManagerOrderSummary[];
}

export interface ManagerRealtimeEnvelope {
  type: string;
  payload: Record<string, unknown>;
  managerId?: number | null;
}

export type ManagerRealtimeState = 'idle' | 'connecting' | 'online' | 'reconnecting' | 'offline';
