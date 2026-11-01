import type { Request, RequestHandler, Response } from 'express';

/**
 * Express 4 не ловит ошибки async-обработчиков сам: передаём их в next().
 * Синхронные исключения (например, NotFoundError) обрабатываются так же.
 */
export function asyncHandler(
  handler: (req: Request, res: Response) => Promise<void> | void,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve()
      .then(() => handler(req, res))
      .catch(next);
  };
}
