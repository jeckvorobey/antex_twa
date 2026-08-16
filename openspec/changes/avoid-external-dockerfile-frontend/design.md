## Context

Docker 28.5.1 с BuildKit уже поддерживает используемый cache mount. Явная syntax
directive добавляет отдельную сетевую зависимость до обработки базовых образов.

## Decision

Удалить `# syntax=docker/dockerfile:1.7` и использовать встроенный frontend
BuildKit. Остальные инструкции Dockerfile не менять.

## Risks

- Старый builder без поддержки `RUN --mount` не сможет собрать образ. Целевая
  среда использует Docker 28.5.1 с BuildKit, поэтому этот риск не относится к
  текущему deployment.
