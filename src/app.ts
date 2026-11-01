import express, { type NextFunction, type Request, type Response } from 'express';
import type { EventController } from './modules/events/EventController';
import { createEventRouter } from './modules/events/eventRoutes';
import { HttpError, NotFoundError } from './shared/errors';

export interface AppDependencies {
  eventController: EventController;
}

export function createApp(deps: AppDependencies): express.Express {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'afishka' });
  });

  app.use('/api/events', createEventRouter(deps.eventController));

  app.use((_req: Request, _res: Response, next: NextFunction) => {
    next(new NotFoundError('Маршрут не найден'));
  });

  // Единый формат ошибок: { error: { status, message } }
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const status = err instanceof HttpError ? err.status : 500;
    const message = err instanceof HttpError ? err.message : 'Внутренняя ошибка сервера';
    res.status(status).json({ error: { status, message } });
  });

  return app;
}
