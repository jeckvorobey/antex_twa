## ADDED Requirements

### Requirement: Единственный realtime transport manager workspace

`ManagerLayout` MUST владеть ровно одним WebSocket transport без периодического polling.
Каждый start/stop lifecycle MUST создавать новую connection generation, чтобы ticket,
socket callbacks, heartbeat и reconnect timer прошлой generation не меняли состояние.

#### Scenario: Повторный lifecycle не оживляет старое соединение

- **WHEN** manager workspace остановлен и запущен снова до завершения старого ticket request
- **THEN** Mini App MUST открыть socket только по ticket текущей generation
- **AND** callbacks и timers старой generation MUST быть проигнорированы

### Requirement: Последовательная reconciliation после realtime ready

Mini App MUST считать REST state авторитетным после `realtime.ready` и MUST применять
следующие socket events только после завершения этой reconciliation.

#### Scenario: Новое событие приходит во время reconciliation

- **WHEN** `chat.message.created` приходит до завершения REST reconciliation
- **THEN** событие MUST быть применено после REST response
- **AND** REST response MUST NOT удалить новое сообщение или уменьшить актуальный unread

#### Scenario: Ready содержит устаревший unread snapshot

- **WHEN** `realtime.ready` содержит более старый unread, чем REST reconciliation
- **THEN** итоговый unread MUST соответствовать REST state

### Requirement: Route-safe manager REST state

Chat list и active conversation requests MUST использовать request generation и
`AbortSignal`. Ответ прошлой generation MUST NOT менять Pinia store после смены фильтра,
открытия другого диалога или завершения route lifecycle.

#### Scenario: Ответ диалога приходит после ухода

- **WHEN** manager покидает conversation route до завершения REST requests
- **THEN** requests MUST быть отменены или проигнорированы
- **AND** active conversation и messages MUST остаться сброшенными

#### Scenario: Ответ старого фильтра приходит последним

- **WHEN** предыдущий filtered chat list response завершается после нового
- **THEN** conversations MUST соответствовать последней request generation

### Requirement: Realtime reducers сохраняют текущий список

Realtime conversation upsert MUST применять фактические `query` и `unreadOnly` filters.
Заявка с terminal status MUST отсутствовать в active orders list и MUST NOT вставляться
туда новым событием.

#### Scenario: Realtime update не соответствует фильтру

- **WHEN** conversation event не соответствует текущему search или unread-only predicate
- **THEN** conversation MUST отсутствовать в видимом списке

#### Scenario: Active заявка получает terminal status

- **WHEN** `chat.order.updated` переводит заявку в completed или cancelled status
- **THEN** заявка MUST быть удалена из active orders list
- **AND** terminal заявка, которой не было в списке, MUST NOT быть вставлена
