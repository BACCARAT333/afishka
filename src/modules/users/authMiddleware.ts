import type { RequestHandler } from 'express';
import { UnauthorizedError } from '../../shared/errors';
import type { TokenService } from './TokenService';

/** Проверяет заголовок «Authorization: Bearer <токен>» и кладёт id пользователя в res.locals.userId. */
export function createAuthMiddleware(tokens: TokenService): RequestHandler {
  return (req, res, next) => {
    const header = req.header('Authorization') ?? '';
    const match = /^Bearer\s+(\S+)$/i.exec(header);
    if (match === null || match[1] === undefined) {
      next(new UnauthorizedError());
      return;
    }
    try {
      res.locals.userId = tokens.verify(match[1]).userId;
      next();
    } catch (error) {
      next(error);
    }
  };
}
