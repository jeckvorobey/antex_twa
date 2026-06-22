# Miniapp

## Запуск в разработке

```bash
yarn install
yarn dev
```

## Запуск через HTTPS-туннель (Telegram Mini App)

Для запуска через `loca.lt` используйте стандартный `quasar dev`:
- `host: 0.0.0.0`
- `port: 5173`
- `allowedHosts: true`

HMR/WebSocket включен (поведение Vite по умолчанию).
