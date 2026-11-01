import express, { type NextFunction, type Request, type Response } from 'express';
import { HttpError, NotFoundError } from './shared/errors';

export function createApp(): express.Express {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'afishka' });
  });

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
