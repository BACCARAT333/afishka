import { FallbackEventSource } from './integrations/kudago/FallbackEventSource';
import { FixtureEventSource } from './integrations/kudago/FixtureEventSource';
import { KudaGoAdapter } from './integrations/kudago/KudaGoAdapter';
import { KudaGoClient } from './integrations/kudago/KudaGoClient';
import { KudaGoEventSource } from './integrations/kudago/KudaGoEventSource';
import type { AppConfig } from './config';
import type { RequestHandler } from 'express';
import { EventController } from './modules/events/EventController';
import { EventFactory } from './modules/events/EventFactory';
import type { EventSource } from './modules/events/EventSource';
import { EventService } from './modules/events/EventService';
import { SqliteEventRepository } from './modules/events/SqliteEventRepository';
import { FavoriteController } from './modules/favorites/FavoriteController';
import { FavoriteService } from './modules/favorites/FavoriteService';
import { SqliteFavoriteRepository } from './modules/favorites/SqliteFavoriteRepository';
import { AuthController } from './modules/users/AuthController';
import { AuthService } from './modules/users/AuthService';
import { createAuthMiddleware } from './modules/users/authMiddleware';
import { BcryptPasswordHasher } from './modules/users/PasswordHasher';
import { SqliteUserRepository } from './modules/users/SqliteUserRepository';
import { JwtTokenService } from './modules/users/TokenService';
import { openDatabase } from './shared/db';
import type { Logger } from './shared/logger';

export interface Container {
  eventController: EventController;
  authController: AuthController;
  favoriteController: FavoriteController;
  requireAuth: RequestHandler;
  close(): void;
}

/**
 * Корень композиции: единственное место, где создаются объекты и передаются друг другу.
 * Глобальных синглтонов нет, всё приходит через конструкторы.
 */
export function createContainer(
  cfg: AppConfig,
  logger: Logger,
  clock: () => Date = () => new Date(),
): Container {
  const db = openDatabase(cfg.dbPath);
  const factory = new EventFactory();
  const adapter = new KudaGoAdapter(factory);
  const fixtures = new FixtureEventSource(adapter, undefined, clock);

  const source: EventSource =
    cfg.eventSource === 'fixtures'
      ? fixtures
      : new FallbackEventSource(
          new KudaGoEventSource(
            new KudaGoClient({ baseUrl: cfg.kudagoBaseUrl, timeoutMs: cfg.kudagoTimeoutMs }),
            adapter,
          ),
          fixtures,
          (error) => logger.warn('KudaGo недоступен, используются запасные данные из JSON', error),
        );

  const repository = new SqliteEventRepository(db, factory);
  const eventService = new EventService(
    source,
    repository,
    { cacheTtlMs: cfg.eventsCacheTtlMs, clock },
    logger,
  );

  const tokens = new JwtTokenService(cfg.jwtSecret, cfg.jwtExpiresInSec);
  const authService = new AuthService(
    new SqliteUserRepository(db),
    new BcryptPasswordHasher(cfg.bcryptRounds),
    tokens,
    undefined,
    clock,
  );
  const favoriteService = new FavoriteService(new SqliteFavoriteRepository(db), repository, clock);

  return {
    eventController: new EventController(eventService, cfg.defaultCity),
    authController: new AuthController(authService),
    favoriteController: new FavoriteController(favoriteService),
    requireAuth: createAuthMiddleware(tokens),
    close: () => db.close(),
  };
}
