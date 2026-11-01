# Афишка

Веб-приложение афиши событий (учебная практика ПМ.02). Данные берутся из публичного API KudaGo.

## Запуск

    npm install
    cp .env.example .env
    npm run dev          # http://localhost:3000/api/health

## Скрипты

| Команда | Что делает |
| --- | --- |
| `npm run dev` | запуск с автоперезагрузкой |
| `npm run build` / `npm start` | сборка и запуск продакшн-версии |
| `npm run typecheck` | проверка типов |
| `npm run lint` / `npm run format` | ESLint / Prettier |
| `npm test` / `npm run test:coverage` | тесты / покрытие (порог 70%, отчёт в `coverage/`) |
| `npm run web:dev` | фронтенд на http://localhost:5173 (нужен запущенный `npm run dev`) |
| `npm run web:build` | сборка фронтенда в `web/dist` |

## Структура

- `src/modules/*` — предметные модули (events, venues, users, favorites)
- `src/integrations/kudago` — клиент и адаптер внешнего API
- `src/shared` — общие ошибки, middleware, утилиты
- `tests/unit`, `tests/integration` — тесты
- `docs/` — диаграммы и материалы для отчёта: `architecture.md`, `class-diagram.md`, `events-service.md`, `integration-kudago.md`, `auth-and-favorites.md`, `frontend.md`, `test-scenarios.md`, `debugging-log.md`
- `web/` — фронтенд
