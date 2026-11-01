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
| `npm test` / `npm run test:coverage` | тесты / покрытие |

## Структура

- `src/modules/*` — предметные модули (events, venues, users, favorites)
- `src/integrations/kudago` — клиент и адаптер внешнего API
- `src/shared` — общие ошибки, middleware, утилиты
- `tests/unit`, `tests/integration` — тесты
- `docs/` — диаграммы и материалы для отчёта
- `web/` — фронтенд
