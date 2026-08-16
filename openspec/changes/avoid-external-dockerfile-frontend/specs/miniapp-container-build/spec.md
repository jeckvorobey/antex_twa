## ADDED Requirements

### Requirement: Сборка использует встроенный Dockerfile frontend

Dockerfile miniapp MUST собираться встроенным frontend BuildKit и MUST NOT
объявлять внешний образ через syntax directive.

#### Scenario: BuildKit начинает обработку Dockerfile

- **WHEN** Coolify запускает сборку miniapp на Docker 28 с BuildKit
- **THEN** builder не загружает `docker/dockerfile` до обработки `FROM`
