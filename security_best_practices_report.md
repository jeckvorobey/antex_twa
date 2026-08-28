# Отчёт по security best practices miniapp

## Краткое резюме

Проверен текущий scope Mini App после изменения карточек заявок: Vue 3 / TypeScript / Quasar,
manager/customer `OrderCard`, обработчики смены статусов, клиентский auth/storage,
production Docker/nginx entrypoint и основные frontend security sinks.

Подтверждённых Critical/High уязвимостей в текущем изменении карточек не найдено.
Новые кнопки менеджера вызывают существующий backend endpoint, который защищён `ManagerUser`,
а статус ограничен диапазоном `1..4`.

Остаточные риски ниже не блокируют карточки, но требуют отдельного решения, если нужен
полный hardening перед релизом.

## Critical / High

Подтверждённых Critical/High finding в изменённых runtime-файлах не найдено.

Проверенные negative-паттерны:

- `OrderCard.vue` не использует `v-html`, `innerHTML`, runtime templates, string event handlers
  или внешнюю навигацию.
- `ManagerOrdersPage.vue` не полагается на frontend-only authorization: статус уходит на backend.
- Production Docker image не запускает Vite/Quasar dev server.

## Medium

### SEC-001 — JWT доступен JavaScript через `localStorage`

- **Rule ID:** `VUE-AUTH-001`, `JS-STORAGE-001`
- **Severity:** Medium
- **Location:** `src/stores/auth.store.ts:34`, `src/stores/auth.store.ts:86`,
  `src/stores/auth.store.ts:188`, `src/boot/axios.ts:10`,
  `src/services/manager-chat.ts:161`
- **Evidence:** `access_token` читается, записывается и удаляется через `localStorage`;
  axios и manager realtime берут Bearer token из JS-accessible storage.
- **Impact:** при появлении DOM XSS злоумышленник сможет прочитать token и выполнять API
  действия до истечения срока действия token, включая manager endpoints при компрометации
  manager-клиента.
- **Fix:** отдельный change на auth contract: memory-only короткоживущий access token с
  повторной Telegram `initData` authentication либо backend-managed HttpOnly cookie + CSRF.
- **Mitigation:** сохранять отсутствие DOM XSS sinks, добавить CSP/Trusted Types где возможно,
  держать TTL коротким, не помещать refresh/session secrets во frontend bundle/storage.
- **False positive notes:** это residual hardening risk, не доказанный exploit; в текущем
  изменении карточек XSS sink не найден.

### SEC-002 — Full dependency audit содержит уязвимости в dev/build tree

- **Rule ID:** `VUE-SUPPLY-001`
- **Severity:** Medium
- **Location:** `package.json:25-35`, `yarn.lock`
- **Evidence:** `yarn audit --level moderate` вернул `74 vulnerabilities`
  (`1 critical`, `52 high`, `18 moderate`, `3 low`). Основные пакеты в advisory tree:
  `happy-dom`, `vite`, `postcss`, `nanoid`, `brace-expansion`, `immutable`, `js-yaml`,
  `lodash`.
- **Impact:** прямой browser runtime сейчас не затронут, но test/build toolchain может быть
  рискованным при обработке недоверенных тестовых fixtures, шаблонов, glob-паттернов или
  package inputs.
- **Fix:** отдельный dependency-hardening change: обновить Quasar/Vite/Vitest/testing extension
  совместимым набором, затем прогнать `yarn test`, `yarn lint`, `yarn build`.
- **Mitigation:** production-only audit сейчас чистый: `yarn audit --groups dependencies
  --level moderate` вернул `0 vulnerabilities`.
- **False positive notes:** эти advisory в основном идут через devDependencies и build-time
  цепочки; не классифицировать как production runtime exploit без отдельной проверки.

## Low / Verify at runtime

### SEC-003 — CSP не видна в repo-level nginx config

- **Rule ID:** `VUE-HEADERS-001`, `JS-CSP-001`
- **Severity:** Low
- **Location:** `nginx.conf:6-8`, `index.html:11`
- **Evidence:** repo-level nginx задаёт `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy`, но не задаёт `Content-Security-Policy`; `index.html` грузит официальный
  Telegram SDK `https://telegram.org/js/telegram-web-app.js`.
- **Impact:** CSP отсутствует как defense-in-depth против будущего XSS. Для Telegram Mini App
  policy нужно проектировать аккуратно, чтобы не сломать `telegram-web-app.js` и embedding.
- **Fix:** проверить фактические headers на edge/reverse proxy и добавить CSP с allowlist для
  self assets и Telegram SDK, если hosting позволяет.
- **Mitigation:** текущий код карточек использует Vue escaping и не добавляет raw HTML sinks.
- **False positive notes:** CSP может задаваться вне repo на CDN/reverse proxy; без runtime
  проверки это не подтверждённая production misconfiguration.

## Проверка текущего изменения карточек

- **Location:** `src/components/orders/OrderCard.vue:57-68`,
  `src/components/orders/OrderCard.vue:122-170`
- **Evidence:** кнопки формируются из developer-controlled status matrix; `labelKey`, `icon`,
  `event` не приходят из API/URL/storage.
- **Security result:** новых XSS, unsafe navigation, `postMessage`, dynamic script injection,
  template compilation или storage-of-secret изменений не добавлено.

- **Location:** `src/pages/manager/ManagerOrdersPage.vue:90-109`,
  `back/app/api/routers/manager.py:218-241`, `back/app/api/deps.py:114-118`,
  `back/app/schemas/chat.py:127-128`
- **Evidence:** frontend action вызывает `chatStore.changeOrderStatus`; backend route принимает
  `manager: ManagerUser`, `get_manager_user()` возвращает `403` для обычного пользователя,
  `ManagerOrderStatusRequest.status` ограничен `ge=1, le=4`.
- **Security result:** новая UI-кнопка не создаёт frontend-only authorization gap.

## Команды аудита

```bash
rg -n --glob '!node_modules/**' --glob '!dist/**' --glob '!.quasar/**' \
  "(v-html|innerHTML|insertAdjacentHTML|document\\.write|eval\\(|new Function|postMessage\\(|window\\.open|localStorage|import\\.meta\\.env)" .

yarn audit --level moderate
yarn audit --groups dependencies --level moderate
```
