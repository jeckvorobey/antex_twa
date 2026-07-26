# Отчёт по security best practices miniapp

## Краткое резюме

Проверен Vue 3 / TypeScript / Quasar frontend, его production Docker/nginx entrypoint,
навигационные URL, media bindings, auth storage и основные XSS/code-execution sinks.
Критических и high-severity уязвимостей в проверенном коде не найдено.

В рамках проверки исправлены два подтверждённых замечания: внешние URL теперь проходят
централизованную HTTPS-only проверку и открываются без `window.opener`; production nginx
получил безопасные базовые headers. Остался один осознанный low-risk auth debt — JWT с
TTL 24 часа хранится в `localStorage`; его перенос требует отдельного изменения auth
lifecycle и backend/browser session contract.

## Исправленные замечания

### SEC-001 — Непроверенные внешние URL

- **Rule ID:** `VUE-XSS-004`, `JS-URL-001`, `JS-URL-002`
- **Severity:** Medium
- **Location:** `src/utils/safe-external-url.ts:4-31`,
  `src/components/ui/AppHeaderBar.vue:53-66`,
  `src/components/orders/MoreMenuSheet.vue:64-73`, `src/pages/ProfilePage.vue:64-88`
- **Evidence:** menu/photo URL приходят из Telegram или backend payload и до исправления
  напрямую передавались в `window.open`/`src`.
- **Impact:** скомпрометированный или ошибочный payload мог передать активную URL-схему
  либо открыть новую вкладку с доступом к `window.opener`.
- **Fix:** добавлены `toSafeExternalUrl` и `openSafeExternalUrl`; разрешены только
  абсолютные `https:` URL, используется `noopener,noreferrer`, `opener` обнуляется.
- **Mitigation:** backend по-прежнему должен валидировать сохраняемые внешние URL.
- **False positive notes:** статические social URLs были безопасными и уже имели
  `rel="noopener noreferrer"`; helper применяется к динамическим URL.

### SEC-002 — Отсутствовали безопасные базовые response headers

- **Rule ID:** `VUE-HEADERS-001`
- **Severity:** Low
- **Location:** `nginx.conf:6-18`
- **Evidence:** production nginx ранее задавал только cache headers.
- **Impact:** браузер не получал явную защиту от MIME sniffing и избыточной передачи
  referrer/capabilities.
- **Fix:** добавлены `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin` и ограничивающий
  `Permissions-Policy`; headers продублированы в asset location из-за правил наследования
  `add_header` nginx.
- **Mitigation:** проверять фактические headers после deployment на reverse proxy/CDN.
- **False positive notes:** `frame-ancestors`/`X-Frame-Options` намеренно не добавлены,
  потому что Telegram Web может встраивать miniapp; допустимые origins требуют проверки
  реального production hosting.

## Низкий остаточный риск

### SEC-003 — Bearer token хранится в `localStorage`

- **Rule ID:** `VUE-AUTH-001`, `JS-STORAGE-001`
- **Severity:** Low
- **Location:** `src/boot/axios.ts:9-22`, `src/stores/auth.store.ts:9-41`
- **Evidence:** `access_token` читается и записывается через `localStorage`; backend default
  `JWT_TTL_SECONDS` равен 86400 секунд.
- **Impact:** при DOM XSS token может быть прочитан и использован до истечения TTL.
- **Fix:** не внесён в этой UI-поставке, потому что существующие tests и non-Telegram
  fallback явно зависят от persistent token. Безопасное исправление — отдельный OpenSpec
  change на memory-only token либо HttpOnly cookie + CSRF contract.
- **Mitigation:** короткий TTL, повторная Telegram initData authentication, отсутствие
  `v-html`/`innerHTML`, HTTPS-only внешние URL и CSP на deployment layer.
- **False positive notes:** это defense-in-depth риск, а не доказанный exploit; текущий
  код не содержит найденного XSS sink.

## Дополнительные проверки

- `v-html`, `innerHTML`, `insertAdjacentHTML`, `document.write`, `eval`, `new Function`,
  dynamic script injection и небезопасные `postMessage` handlers не найдены.
- Production image строится через `yarn build` и обслуживается nginx, dev server в
  production не используется.
- `VITE_API_URL` является публичной browser-конфигурацией; секреты в проверенных
  frontend sources не обнаружены.
- CSP/clickjacking policy не видна в repo и должна быть проверена на фактическом edge с
  учётом обязательного Telegram embedding и `telegram-web-app.js`.
