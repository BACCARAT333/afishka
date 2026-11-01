import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../../shared/errors';
import type { User } from './User';

export interface TokenPayload {
  userId: string;
}

export interface TokenService {
  sign(user: User): string;
  /** Возвращает данные из токена или бросает UnauthorizedError. */
  verify(token: string): TokenPayload;
}

export class JwtTokenService implements TokenService {
  public constructor(
    private readonly secret: string,
    private readonly expiresInSec: number,
  ) {}

  public sign(user: User): string {
    return jwt.sign({ email: user.email }, this.secret, {
      algorithm: 'HS256',
      subject: user.id,
      expiresIn: this.expiresInSec,
    });
  }

  public verify(token: string): TokenPayload {
    try {
      const payload = jwt.verify(token, this.secret, { algorithms: ['HS256'] });
      if (typeof payload === 'string' || typeof payload.sub !== 'string') {
        throw new Error('В токене нет пользователя');
      }
      return { userId: payload.sub };
    } catch {
      throw new UnauthorizedError('Недействительный или просроченный токен');
    }
  }
}
