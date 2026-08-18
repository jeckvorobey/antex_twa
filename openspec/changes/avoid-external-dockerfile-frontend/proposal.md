## Why

Coolify не может начать сборку miniapp, когда BuildKit отдельно загружает
`docker/dockerfile:1.7`: DNS-сбой CloudFront останавливает deployment до первого
этапа `FROM`.

## What Changes

- Dockerfile использует встроенный frontend установленного BuildKit.
- Регрессионный тест запрещает внешнюю Dockerfile syntax image.

## Capabilities

### New Capabilities

- `miniapp-container-build`: воспроизводимая сборка контейнера без отдельной
  загрузки Dockerfile frontend.

## Impact

- `Dockerfile` miniapp.
- Контрактный тест Docker-конфигурации.
