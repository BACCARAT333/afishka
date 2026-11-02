import request from 'supertest';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app';
import { loadConfig } from '../../src/config';
import { createContainer } from '../../src/container';
import { SilentLogger } from '../../src/shared/logger';

describe('loadConfig: тестовый пользователь и папка фронтенда', () => {
  it('по умолчанию тестового пользователя нет', () => {
    expect(loadConfig({}).seedUser).toBeNull();
  });

  it('читает SEED_USER_EMAIL и SEED_USER_PASSWORD', () => {
    const cfg = loadConfig({
      SEED_USER_EMAIL: ' demo@afishka.test ',
      SEED_USER_PASSWORD: 'secret-pass',
    });
    expect(cfg.seedUser).toEqual({ email: 'demo@afishka.test', password: 'secret-pass' });
  });

  it('пустой пароль отключает создание пользователя', () => {
    expect(
      loadConfig({ SEED_USER_EMAIL: 'demo@afishka.test', SEED_USER_PASSWORD: '' }).seedUser,
    ).toBeNull();
  });

  it('путь к сборке фронтенда можно задать переменной WEB_DIST_DIR', () => {
    expect(loadConfig({ WEB_DIST_DIR: '/srv/web' }).webDistDir).toBe('/srv/web');
  });
});

describe('создание тестового пользователя при запуске', () => {
  const cfg = {
    ...loadConfig({}),
    dbPath: ':memory:',
    eventSource: 'fixtures' as const,
    jwtSecret: 'test-secret',
    bcryptRounds: 4,
    seedUser: { email: 'demo@afishka.test', password: 'demo-password-2026' },
  };
  const container = createContainer(cfg, new SilentLogger());
  const app = createApp(container);
  afterAll(() => container.close());

  it('пользователь может войти с данными из настроек', async () => {
    await vi.waitFor(async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'demo@afishka.test', password: 'demo-password-2026' });
      expect(res.status).toBe(200);
    });
  });

  it('неверный пароль по-прежнему отклоняется', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'demo@afishka.test', password: 'wrong-password' });
    expect(res.status).toBe(401);
  });
});
