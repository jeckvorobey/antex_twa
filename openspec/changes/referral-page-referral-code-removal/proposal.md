## Why

На ReferralPage поле «реферальный код» лишнее: пользователю достаточно видеть реферальную ссылку и кнопку «Поделиться». Удаление этого поля упрощает экран и делает акцент на основном действии.

## What Changes

- Поле «реферальный код» полностью удаляется из ReferralPage.
- На экране остаются только реферальная ссылка и кнопка «Поделиться».
- Вёрстка ReferralPage корректируется, чтобы после удаления поля не осталось пустых зазоров и визуального шума.
- Лишний блок «Сколько можно заработать» удаляется.
- История AEX-операций отображает уже загруженные начисления независимо от состояния infinite scroll.

## Capabilities

### New Capabilities
- `referral-page-simplified-share`: simplified referral UI focused on link + share button.

### Modified Capabilities
- `referral-page-ui`: сокращается состав видимых элементов на странице рефералок.

## Impact

- ReferralPage layout and related UI components.
- Tests/fixtures that still expect referral_code to be visible.
- Styling around the referral section spacing.
- AEX transaction history rendering on ReferralPage.
