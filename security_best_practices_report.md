# Отчёт по security best practices miniapp

## Краткое резюме

Проверены Vue 3 / TypeScript / Quasar frontend, Telegram SDK bootstrap,
production Docker/nginx entrypoint, внешние URL, auth storage и основные
XSS/code-execution sinks. Критических, high- и неподтверждённых medium-severity
уязвимостей в проверенном коде не найдено.

В рамках текущей проверки добавлен production CSP с разрешением только официального
Telegram SDK origin и усилен поиск уже созданного SDK script против DOM clobbering.
Ранее внедрённые HTTPS-only URL guards и базовые security headers сохранены и повторно
проверены.

## Исправленные замечания

### SEC-001 — Динамические внешние URL без централизованной allowlist

- **Rule ID:** `JS-URL-001`, `JS-URL-002`
- **Severity:** Medium
- **Location:** `src/utils/safe-external-url.ts:1-66`,
  `src/components/ui/AppBottomNav.vue:26-38`, `src/pages/ProfilePage.vue:64-88`,
  `src/components/orders/MoreMenuSheet.vue:64-73`
- **Evidence:** avatar/menu URL поступают из Telegram или backend payload и являются
  недоверенными browser input.
- **Impact:** без проверки payload мог бы передать активную URL-схему или открыть новую
  вкладку с доступом к `window.opener`.
- **Fix:** все динамические media URL ограничены абсолютным `https:`; внешняя навигация
  проходит allowlist `https:`/строгого `tg://user?id=...` и открывается с
  `noopener,noreferrer`.
- **Mitigation:** backend также должен валидировать сохраняемые внешние URL.
- **False positive notes:** статические social URL уже имели
  `rel="noopener noreferrer"` и не являлись уязвимостью.

### SEC-002 — Не было CSP для runtime Telegram SDK

- **Rule ID:** `VUE-HEADERS-001`, `VUE-THIRDPARTY-001`, `VUE-SRI-001`
- **Severity:** Medium
- **Location:** `nginx.conf:6-20`, `src/boot/telegram.ts:6-8,78-123`
- **Evidence:** Mini App загружает официальный
  `https://telegram.org/js/telegram-web-app.js`, а production nginx ранее не
  ограничивал допустимые script origins.
- **Impact:** при появлении HTML/script injection отсутствие CSP увеличивало бы радиус
  DOM XSS и позволяло загрузку скрипта с произвольного origin.
- **Fix:** добавлен CSP response header без `unsafe-eval`; `script-src` разрешает только
  `'self'` и `https://telegram.org`. Источник SDK задан константой, загрузка выполняется
  только в Telegram launch environment. CSP продублирован в asset location из-за
  наследования `add_header` nginx.
- **Mitigation:** после deployment проверить фактический header на reverse proxy/CDN.
  SRI не добавлен, потому что официальный Telegram SDK URL не version-pinned и Telegram
  обновляет его содержимое; риск ограничен фиксированным origin и CSP.
- **False positive notes:** `style-src 'unsafe-inline'` оставлен для runtime styles
  Quasar/Vue; выполнение inline JavaScript политикой не разрешено.

### SEC-003 — Недостаточно строгий selector существующего SDK script

- **Rule ID:** `JS-DOM-001`, `VUE-THIRDPARTY-001`
- **Severity:** Low
- **Location:** `src/boot/telegram.ts:93-119`
- **Evidence:** поиск по одному `#telegram-web-app-sdk` мог вернуть элемент другого типа
  с совпадающим `id`.
- **Impact:** при DOM clobbering загрузка SDK могла быть заблокирована до timeout.
- **Fix:** selector ограничен `script#telegram-web-app-sdk`; URL по-прежнему задаётся
  только внутренней константой.
- **Mitigation:** CSP дополнительно ограничивает допустимый script origin.
- **False positive notes:** эксплуатация требует предварительной возможности внедрить
  DOM; исправление является defense-in-depth.

## Низкий остаточный риск

### SEC-004 — Bearer token хранится в `localStorage`

- **Rule ID:** `VUE-AUTH-001`, `JS-STORAGE-001`
- **Severity:** Low
- **Location:** `src/boot/axios.ts:9-22`, `src/stores/auth.store.ts:9-41`
- **Evidence:** `access_token` читается и записывается через `localStorage`.
- **Impact:** при DOM XSS token может быть прочитан JavaScript-кодом.
- **Fix:** не внесён: memory-only token либо HttpOnly cookie требуют отдельного изменения
  backend auth/session contract, что выходит за ограничения текущей UI-задачи.
- **Mitigation:** CSP, отсутствие найденных HTML/code sinks, HTTPS-only URL bindings,
  повторная Telegram `initData` authentication и ограниченный JWT TTL.
- **False positive notes:** это defense-in-depth риск, а не доказанный exploit; найденного
  пути XSS к storage в текущем коде нет.

## Дополнительные проверки

- Не найдены `v-html`, `innerHTML`, `insertAdjacentHTML`, `document.write`, `eval`,
  `new Function`, string timers, unsafe `postMessage` handlers или open redirects.
- `target="_blank"` используется с `rel="noopener noreferrer"`.
- `.env` игнорируется Git; секреты в tracked frontend sources не обнаружены.
- Production image собирается через `yarn build` и обслуживается nginx, dev server в
  production не используется.
- `yarn audit` не дал пригодного результата: registry вернул gzip payload вместо
  ожидаемого JSON. Dependency advisories нужно дополнительно контролировать через GitHub
  Dependabot/CI на стороне репозитория.
- `frame-ancestors`/`X-Frame-Options` намеренно не добавлены: Mini App должна
  встраиваться Telegram.
