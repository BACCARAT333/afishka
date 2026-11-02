import { existsSync } from 'node:fs';
import { join } from 'node:path';
import express, {
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
} from 'express';
import type { EventController } from './modules/events/EventController';
import type { FavoriteController } from './modules/favorites/FavoriteController';
import type { AuthController } from './modules/users/AuthController';
import { createAuthRouter } from './modules/users/authRoutes';
import { createFavoriteRouter } from './modules/favorites/favoriteRoutes';
import { createEventRouter } from './modules/events/eventRoutes';
import { HttpError, NotFoundError } from './shared/errors';

export interface AppDependencies {
  eventController: EventController;
  authController: AuthController;
  favoriteController: FavoriteController;
  requireAuth: RequestHandler;
  /** Папка со сборкой фронтенда; если не задана или пуста, сайт не отдаётся (только API). */
  staticDir?: string;
}

export function createApp(deps: AppDependencies): express.Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'afishka' });
  });

  app.use('/api/auth', createAuthRouter(deps.authController));
  app.use('/api/events', createEventRouter(deps.eventController));
  app.use('/api/favorites', createFavoriteRouter(deps.favoriteController, deps.requireAuth));

  // Сайт (сборка web/dist) отдаётся тем же сервером; маршрутизация во фронтенде на хэшах (#/...)
  if (deps.staticDir !== undefined && existsSync(join(deps.staticDir, 'index.html'))) {
    app.use(express.static(deps.staticDir));
  }

  app.use((_req: Request, _res: Response, next: NextFunction) => {
    next(new NotFoundError('Маршрут не найден'));
  });

  // Единый формат ошибок: { error: { status, message } }
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    // express.json() при неверном JSON бросает SyntaxError с полем body
    const badJson = err instanceof SyntaxError && 'body' in err;
    const status = err instanceof HttpError ? err.status : badJson ? 400 : 500;
    const message =
      err instanceof HttpError
        ? err.message
        : badJson
          ? 'Некорректный JSON в теле запроса'
          : 'Внутренняя ошибка сервера';
    res.status(status).json({ error: { status, message } });
  });

  return app;
}
