import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AuthService } from '../../src/modules/users/AuthService';
import { BcryptPasswordHasher } from '../../src/modules/users/PasswordHasher';
import { SqliteUserRepository } from '../../src/modules/users/SqliteUserRepository';
import { JwtTokenService } from '../../src/modules/users/TokenService';
import { type Db, openDatabase } from '../../src/shared/db';
import { ConflictError, UnauthorizedError } from '../../src/shared/errors';

const credentials = { email: 'user@example.com', password: 'password123' };
let db: Db;
let service: AuthService;
let tokens: JwtTokenService;

beforeEach(() => {
  db = openDatabase(':memory:');
  tokens = new JwtTokenService('test-secret', 3600);
  service = new AuthService(new SqliteUserRepository(db), new BcryptPasswordHasher(4), tokens);
});
afterEach(() => db.close());

describe('AuthService.register', () => {
  it('создаёт пользователя, хранит хэш вместо пароля и выдаёт токен', async () => {
    const { user, token } = await service.register(credentials);

    expect(user.email).toBe('user@example.com');
    expect(user.passwordHash).not.toBe(credentials.password);
    expect(user.passwordHash.length).toBeGreaterThan(20);
    expect(tokens.verify(token).userId).toBe(user.id);
  });

  it('toJSON не содержит хэш пароля', async () => {
    const { user } = await service.register(credentials);
    expect(JSON.stringify(user)).not.toContain('passwordHash');
    expect(JSON.stringify(user)).not.toContain(user.passwordHash);
  });

  it('второй раз с тем же email — ConflictError', async () => {
    await service.register(credentials);
    await expect(service.register(credentials)).rejects.toBeInstanceOf(ConflictError);
  });
});

describe('AuthService.login', () => {
  it('верные данные дают токен того же пользователя', async () => {
    const registered = await service.register(credentials);
    const { user, token } = await service.login(credentials);

    expect(user.id).toBe(registered.user.id);
    expect(tokens.verify(token).userId).toBe(user.id);
  });

  it('неверный пароль и неизвестный email дают одинаковую ошибку', async () => {
    await service.register(credentials);
    const wrongPassword = service.login({ ...credentials, password: 'другой-пароль' });
    const unknownEmail = service.login({ email: 'nobody@example.com', password: 'password123' });

    await expect(wrongPassword).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(unknownEmail).rejects.toBeInstanceOf(UnauthorizedError);
    const messages = await Promise.all(
      [wrongPassword, unknownEmail].map((p) => p.catch((e: Error) => e.message)),
    );
    expect(messages[0]).toBe(messages[1]);
  });
});
