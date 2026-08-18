# Proposal: Manager Chat Workspace

## Why

Менеджеру нужен отдельный мобильный operational workspace внутри уже авторизованной Telegram Mini App. Клиентский UI и административная панель для этой роли избыточны.

## Changes

- Для `role=MANAGER` использовать отдельный shell и меню `Чаты / Заявки / Профиль`.
- Добавить realtime WebSocket без периодического polling.
- Отображать новые сообщения, unread/read и delivery state мгновенно.
- Поддержать текст и вложения в диалоге.
- Использовать общие manager UI-компоненты вместо page-local копий.
- Сохранить текущую AntEx deep-green/gold дизайн-систему.

## Capabilities

- `manager-chat-workspace` — отдельный manager shell, REST/realtime state и устойчивые к
  гонкам lifecycle contracts Mini App.

## Source of truth

Полная межрепозиторная спецификация и визуальный design board находятся в `jeckvorobey/antex_product`, change `manager-chat-workspace`.
