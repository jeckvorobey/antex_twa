# Changelog

Все заметные изменения в этом проекте документированы в этом файле.
Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/).

## [Unreleased]

### Added

- Реферальная программа AEX: страница /referral с балансом, реферальным кодом, копированием, шерингом и инструкцией
- Компонент AexSellDialog для продажи AEX: выбор ордера, ввод суммы, валидация, выполнение продажи
- Глубокая ссылка (deep-link) для приглашений: обработка startapp=ref_<код> через boot/referral.ts
- Хранилище aex.store: управление реферальными данными, балансом AEX и транзакциями с пагинацией
- API-интеграция: fetchAexReferralInfo, fetchAexTransactions, applyReferralCode, transferAex
- Типы данных: AexBalance, AexReferralInfo, AexTransactionItem, AexTransactionsResponse, AexProfileSection
- Карточка баланса AEX на странице профиля с переходом на страницу реферальной программы
- Маршрут /referral зарегистрирован в роутере
- Локализация (ru): все ключи для реферальной программы и диалога продажи AEX
- Страница истории транзакций AEX с бесконечной прокруткой
- Тесты: 31 файл, 175 тестов — все проходят

### Changed

- Страница ProfilePage дополнена карточкой баланса AEX с кликабельным переходом на /referral
- Роутер обновлён: добавлен маршрут /referral
