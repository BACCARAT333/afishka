# Авторизация и избранное (шаг 5)

Пользователь регистрируется по email и паролю, получает JWT и передаёт его в заголовке
`Authorization: Bearer <токен>`. Маршруты `/api/favorites` доступны только с токеном.

## Диаграмма классов

```mermaid
classDiagram
  class User {
    -props: UserProps
    +id: string
    +email: string
    +passwordHash: string
    +createdAt: Date
    +toJSON() object
  }
  class AuthService {
    -users: IUserRepository
    -hasher: PasswordHasher
    -tokens: TokenService
    +register(credentials) AuthResult
    +login(credentials) AuthResult
  }
  class PasswordHasher {
    <<interface>>
    +hash(plain) string
    +verify(plain, hash) boolean
  }
  class TokenService {
    <<interface>>
    +sign(user) string
    +verify(token) TokenPayload
  }
  class IUserRepository {
    <<interface>>
    +add(user) void
    +findByEmail(email) User
    +findById(id) User
  }
  class Favorite {
    -userId: string
    -eventId: string
    -createdAt: Date
  }
  class FavoriteService {
    -favorites: IFavoriteRepository
    -events: IEventRepository
    +list(userId) Event[]
    +add(userId, eventId) boolean
    +remove(userId, eventId) void
  }
  class IFavoriteRepository {
    <<interface>>
    +add(favorite) boolean
    +remove(userId, eventId) boolean
    +listByUser(userId) Favorite[]
  }
  AuthService --> IUserRepository
  AuthService --> PasswordHasher
  AuthService --> TokenService
  AuthService ..> User
  PasswordHasher <|.. BcryptPasswordHasher
  TokenService <|.. JwtTokenService
  IUserRepository <|.. SqliteUserRepository
  IFavoriteRepository <|.. SqliteFavoriteRepository
  FavoriteService --> IFavoriteRepository
  FavoriteService ..> Favorite
```

## Алгоритм входа и защиты маршрутов

```mermaid
flowchart TD
  A([POST /api/auth/login]) --> B{email и password корректны?}
  B -- нет --> B1[400]
  B -- да --> C{Пользователь найден?}
  C -- нет --> C1[Сравнение с пустышкой] --> E1[401: неверный email или пароль]
  C -- да --> D{bcrypt: пароль совпал?}
  D -- нет --> E1
  D -- да --> F[Подпись JWT: sub = id пользователя]
  F --> G([200: user и token])

  H([Запрос к /api/favorites]) --> I{Заголовок Bearer есть?}
  I -- нет --> J[401]
  I -- да --> K{Подпись и срок токена верны?}
  K -- нет --> J
  K -- да --> L[res.locals.userId] --> M([Контроллер и сервис избранного])
```

## Эндпоинты

| Метод и путь | Доступ | Ответы |
| --- | --- | --- |
| `POST /api/auth/register` | открыт | 201 `{user, token}`, 400, 409 |
| `POST /api/auth/login` | открыт | 200 `{user, token}`, 400, 401 |
| `GET /api/favorites` | токен | 200 `{items}`, 401 |
| `POST /api/favorites/:eventId` | токен | 201 добавлено, 200 уже было, 404 нет события |
| `DELETE /api/favorites/:eventId` | токен | 204, 404 нет в избранном |

## Меры безопасности

- Пароль хранится только как bcrypt-хэш, хэш не попадает в ответы API.
- Пароль от 8 символов и не длиннее 72 байт (ограничение bcrypt).
- Неверный пароль и неизвестный email дают одинаковый ответ 401, время ответа выравнивается.
- Секрет JWT берётся из `.env`; в production приложение не стартует без `JWT_SECRET`.
- Допустим только алгоритм HS256 при проверке токена.
