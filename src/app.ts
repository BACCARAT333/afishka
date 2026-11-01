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
}

export function createApp(deps: AppDependencies): express.Express {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'afishka' });
  });

  app.use('/api/auth', createAuthRouter(deps.authController));
  app.use('/api/events', createEventRouter(deps.eventController));
  app.use('/api/favorites', createFavoriteRouter(deps.favoriteController, deps.requireAuth));

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
