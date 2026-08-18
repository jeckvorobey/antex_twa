# Design: Manager Chat Workspace

## Routing

`App.vue` resolves workspace by authenticated Telegram user role. Manager users are redirected into `/manager/*`; ordinary users are redirected out of manager routes.

## Layout

`ManagerLayout` owns one persistent realtime connection and a dedicated three-item bottom navigation. Client `MainLayout` remains unchanged.

## State

- `manager-chat.store.ts`: REST source-of-truth state for conversations, messages, orders and unread counters.
- `manager-realtime.store.ts`: socket ticket, WebSocket lifecycle, heartbeat, reconnect and event forwarding.
- Reconnect always calls REST reconciliation.

### Race safety

- `realtime.ready` reconciliation и следующие socket events обрабатываются одной
  последовательной очередью; ready payload не перезаписывает авторитетный REST unread snapshot.
- Каждый start/stop realtime transport создаёт новую connection generation. Ticket,
  socket callbacks, reconnect, heartbeat и уже начатая REST reconciliation от прошлой
  generation отменяются и игнорируются.
- Запросы списка чатов и active conversation используют `AbortSignal` и request generation,
  поэтому поздний ответ после смены фильтра или route lifecycle не меняет store.
- Страница списка отменяет свой запрос при unmount; late `markRead` дополнительно проверяет
  active generation и unread revision.
- Realtime upsert применяет `query` отдельно к username/firstName/lastName, как backend
  `ILIKE`, и текущий `unreadOnly`.
- Active orders REST использует request/state generation: realtime terminal update отменяет
  старый snapshot. Terminal заявки не входят в active list, но detail остаётся актуальным.

## Components

Reusable primitives:

- `ManagerBottomNav`
- `ManagerPageHeader`
- `ConnectionStatePill`
- `UnreadBadge`
- `ConversationListItem`
- `OrderStatusChip`
- `OrderSummaryCard`
- `ChatBubble`
- `ChatAttachmentCard`
- `ChatComposer`
- `ChatDateDivider`
- `EmptyStateCard`

## Screens

- Chats: search + All/Unread filters + cloud conversation cards.
- Conversation: compact order context + Telegram-like bubbles + attachments + fixed composer.
- Orders: active order cards, open chat, detail and status actions.
- Profile: manager identity, realtime and fallback notification state.

## Visual language

Use existing AntEx dark/deep-green layered background, restrained gold highlights, 20–24px cloud surfaces and floating rounded navigation. Telegram is a UX reference only; its blue palette is not introduced.
