# Интеграция с KudaGo API (шаг 3)

Сервисы приложения зависят от интерфейса `EventSource`. Реальный API, запасные данные
и механизм переключения — это его реализации.

## Структура

```mermaid
classDiagram
  class EventSource {
    <<interface>>
    +fetchEvents(query) Event[]
  }
  class KudaGoEventSource
  class FixtureEventSource
  class FallbackEventSource
  class KudaGoClient {
    -baseUrl: string
    -timeoutMs: number
    +getEvents(query) KudaGoListResponse
  }
  class KudaGoAdapter {
    +toEvents(raws, city, now) Event[]
    +toEvent(raw, city, now) Event | null
  }
  class EventFactory
  EventSource <|.. KudaGoEventSource
  EventSource <|.. FixtureEventSource
  EventSource <|.. FallbackEventSource
  FallbackEventSource o-- EventSource : primary
  FallbackEventSource o-- EventSource : fallback
  KudaGoEventSource --> KudaGoClient
  KudaGoEventSource --> KudaGoAdapter
  FixtureEventSource --> KudaGoAdapter
  KudaGoAdapter --> EventFactory
```

## Алгоритм получения событий с запасным вариантом

```mermaid
flowchart TD
  A([Запрос событий]) --> B[KudaGoEventSource: запрос к API]
  B --> C{Ответ получен?}
  C -- да --> D[KudaGoAdapter: ответ в Event через фабрику]
  C -- "нет: тайм-аут, сеть, статус не 2xx" --> E[IntegrationError]
  E --> F[FallbackEventSource: запись в журнал]
  F --> G[FixtureEventSource: данные из JSON, фильтры и страницы]
  G --> D
  D --> H{Категория поддерживается и данные верны?}
  H -- да --> I[Событие попадает в результат]
  H -- нет --> J[Событие пропускается]
  I --> K([Список событий])
  J --> K
```

## Правила адаптера

- Категория: `concert`, `theater`, `exhibition`, `cinema`; `permanent-exhibitions` даёт `Exhibition` с `permanent = true`.
- Даты: из списка берётся ближайший не закончившийся сеанс. «Бессрочные» метки времени (меньше 0 или больше 4·10⁹ секунд) отбрасываются.
- Событие с неверными данными (пустое название и т.п.) или неподдерживаемой категорией пропускается.
- Возраст `"12+"` превращается в число 12.
