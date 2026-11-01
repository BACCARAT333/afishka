# Сервис событий и кэш (шаг 4)

Запрос списка событий идёт по цепочке `routes → controller → service → repository → SQLite`.
Источник данных (`EventSource`) подключается к сервису через конструктор и вызывается только
тогда, когда кэш города устарел.

## Диаграмма классов

```mermaid
classDiagram
  class EventController {
    -service: EventService
    -defaultCity: string
    +list(req, res) void
    +get(req, res) void
  }
  class EventService {
    -source: EventSource
    -repository: IEventRepository
    -inflight: Map
    +list(query) Page~Event~
    +getById(id) Event
    -ensureFresh(city) void
    -sync(city) void
  }
  class IEventRepository {
    <<interface>>
    +saveMany(events, cachedAt) void
    +findById(id) Event
    +findByCity(city) Event[]
    +getSyncedAt(city) Date
    +markSynced(city, at) void
  }
  class SqliteEventRepository {
    -db: Db
    -factory: EventFactory
  }
  class FilterStrategy {
    <<interface>>
    +matches(event) boolean
  }
  class SortStrategy {
    <<interface>>
    +compare(a, b) number
  }
  EventController --> EventService
  EventService --> IEventRepository
  EventService --> EventSource
  EventService ..> FilterStrategy
  EventService ..> SortStrategy
  IEventRepository <|.. SqliteEventRepository
  SqliteEventRepository --> EventFactory
  FilterStrategy <|.. CategoryFilter
  FilterStrategy <|.. FreeOnlyFilter
  FilterStrategy <|.. DateRangeFilter
  FilterStrategy <|.. TextSearchFilter
  SortStrategy <|.. SortByDate
  SortStrategy <|.. SortByTitle
```

## Алгоритм получения событий с кэшем и запасным вариантом

```mermaid
flowchart TD
  A([GET /api/events]) --> B[Проверка параметров: ошибка 400]
  B --> C{Кэш города свежий?}
  C -- да --> H
  C -- нет --> D{Обновление уже идёт?}
  D -- да --> E[Ждём его результата]
  D -- нет --> F[EventSource: KudaGo, при сбое JSON]
  F --> G{Получили события?}
  G -- да --> G1[Сохранить в SQLite, отметить время] --> H
  G -- нет --> G2{В кэше есть данные?}
  G2 -- да --> G3[Журнал: отдаём устаревшие] --> H
  G2 -- нет --> G4[Ошибка 502 или 504]
  E --> H[Прочитать события города из SQLite]
  H --> I[Фильтры: даты, категория, бесплатные, текст]
  I --> J[Сортировка и страница]
  J --> K([200: items, page, pageSize, total, totalPages])
```

## Параметры GET /api/events

| Параметр | Значение | По умолчанию |
| --- | --- | --- |
| `city` | код города: `spb`, `msk` | `DEFAULT_CITY` |
| `category` | `concert`, `theater`, `exhibition`, `cinema` | любая |
| `dateFrom`, `dateTo` | `ГГГГ-ММ-ДД` или ISO 8601 | от текущего момента |
| `free` | `true` — только бесплатные | без ограничения |
| `q` | текст до 100 символов | без поиска |
| `sort` | `date`, `title` | `date` |
| `page`, `pageSize` | от 1; размер страницы 1–50 | 1 и 20 |

Событие попадает в выборку, если оно не закончилось к `dateFrom` и началось не позже `dateTo`.
Постоянная экспозиция всегда считается актуальной.

`GET /api/events/:id` отдаёт событие из кэша; если такого нет, ответ 404.
