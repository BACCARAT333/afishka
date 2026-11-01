import { describe, expect, it } from 'vitest';
import { JwtTokenService } from '../../src/modules/users/TokenService';
import { User } from '../../src/modules/users/User';
import { UnauthorizedError } from '../../src/shared/errors';

const user = new User({
  id: 'u1',
  email: 'user@example.com',
  passwordHash: 'hash',
  createdAt: new Date('2026-11-01T00:00:00Z'),
});

describe('JwtTokenService', () => {
  it('подписанный токен проверяется и возвращает id пользователя', () => {
    const service = new JwtTokenService('secret', 3600);
    expect(service.verify(service.sign(user))).toEqual({ userId: 'u1' });
  });

  it('токен с чужим секретом отклоняется', () => {
    const token = new JwtTokenService('secret', 3600).sign(user);
    expect(() => new JwtTokenService('other', 3600).verify(token)).toThrow(UnauthorizedError);
  });

  it('просроченный токен отклоняется', () => {
    const service = new JwtTokenService('secret', -10);
    expect(() => service.verify(service.sign(user))).toThrow(UnauthorizedError);
  });

  it('мусор вместо токена отклоняется', () => {
    expect(() => new JwtTokenService('secret', 3600).verify('abc.def.ghi')).toThrow(
      UnauthorizedError,
    );
  });
});
