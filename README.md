# Афишка

[![CI](https://github.com/BACCARAT333/afishka/actions/workflows/ci.yml/badge.svg)](https://github.com/BACCARAT333/afishka/actions/workflows/ci.yml)
[![Maintainability](https://api.codeclimate.com/v1/badges/<ID_БЕЙДЖА>/maintainability)](https://codeclimate.com/github/BACCARAT333/afishka/maintainability)

Афишка — веб-приложение афиши событий (по типу Яндекс Афиши). Показывает концерты, спектакли, выставки и кино с фильтрами по городу, категории, датам, цене и тексту. Данные берутся из публичного API KudaGo и кэшируются в базе SQLite; если API недоступно, приложение работает на запасных данных из JSON. Зарегистрированный пользователь может вести список избранных событий.

**Сайт:** <ССЫЛКА_НА_ДЕПЛОЙ>

**Тестовый аккаунт:** `demo@afishka.test` / `demo-password-2026`

## Стек

| Слой | Технологии |
| --- | --- |
| Frontend | Vite, TypeScript (без фреймворка), хэш-маршрутизация |
| Backend | Node.js 20+, Express, TypeScript (strict), JWT, bcryptjs |
| База данных | SQLite (better-sqlite3), режим WAL, внешние ключи |
| Интеграции | публичный API KudaGo, запасной источник на JSON |
| Качество | Vitest + supertest, ESLint, Prettier, GitHub Actions |
| Деплой | Render (`render.yaml`) |

## Возможности

- список событий с фильтрами: город, категория, период дат, «только бесплатные», поиск по тексту, пагинация;
- страница события: описание, место, даты, цена, изображение;
- регистрация и вход (JWT, пароли хранятся в виде bcrypt-хэша);
- избранное: добавить, удалить, список (только для авторизованных);
- кэш событий в SQLite со сроком свежести и переключение на запасные данные при сбое внешнего API.

## Запуск локально

Нужны Node.js 20+ и npm.

    git clone https://github.com/BACCARAT333/afishka.git
    cd afishka
    npm install
    cp .env.example .env
    npm run dev          # API: http://localhost:3000/api/health
    npm run web:dev      # сайт: http://localhost:5173 (в другой вкладке терминала)

Как собрать и запустить одним сервером (как на деплое):

    npm run build && npm run web:build
    npm start            # сайт и API на http://localhost:3000

## Скрипты

| Команда | Что делает |
| --- | --- |
| `npm run dev` | сервер с автоперезагрузкой |
| `npm run build` / `npm start` | сборка и запуск серверной части |
| `npm run web:dev` / `npm run web:build` | фронтенд в режиме разработки / сборка в `web/dist` |
| `npm run typecheck` | проверка типов |
| `npm run lint` / `npm run format` | ESLint / Prettier |
| `npm test` / `npm run test:coverage` | тесты / покрытие (порог 70%, отчёт в `coverage/`) |
| `npm run kudago:check` | живой запрос к KudaGo и вывод событий после адаптера |

## Настройки

Задаются в `.env` (образец — `.env.example`): порт, путь к базе, срок кэша, источник событий (`auto` или `fixtures`), секрет JWT, срок жизни токена, сложность bcrypt. Для демонстрации можно задать `SEED_USER_EMAIL` и `SEED_USER_PASSWORD`: такой пользователь создаётся при запуске.

## REST API

| Метод и путь | Назначение |
| --- | --- |
| `GET /api/health` | проверка работоспособности |
| `POST /api/auth/register`, `POST /api/auth/login` | регистрация и вход, ответ с токеном |
| `GET /api/events` | список событий (`city`, `category`, `dateFrom`, `dateTo`, `free`, `q`, `page`, `pageSize`) |
| `GET /api/events/:id` | одно событие |
| `GET /api/favorites`, `POST /api/favorites/:eventId`, `DELETE /api/favorites/:eventId` | избранное (заголовок `Authorization: Bearer <токен>`) |

Ошибки возвращаются в едином формате `{ "error": { "status": 404, "message": "..." } }`.

## Структура

- `src/modules/*` — предметные модули (events, venues, users, favorites): маршруты, контроллеры, сервисы, репозитории
- `src/integrations/kudago` — клиент и адаптер KudaGo, запасной источник (`fixtures/events.json`)
- `src/shared` — ошибки, журнал, подключение к БД
- `web/` — фронтенд
- `tests/unit`, `tests/integration` — тесты
- `docs/` — архитектура, диаграммы, сценарии тестов, журнал отладки

## Лицензия

Учебный проект (практика ПМ.02).
