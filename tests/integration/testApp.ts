import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../src/app';
import { loadConfig } from '../../src/config';
import { createContainer, type Container } from '../../src/container';
import { SilentLogger } from '../../src/shared/logger';

/** Фиксированный «сейчас»: данные в fixtures относятся к 2027 году. */
export const NOW = new Date('2026-11-01T00:00:00Z');

/** Приложение для тестов: БД в памяти, только запасные данные из JSON, фиксированное время. */
export function createTestApp(): { app: Express; container: Container } {
  const cfg = {
    ...loadConfig({}),
    dbPath: ':memory:',
    eventSource: 'fixtures' as const,
    jwtSecret: 'test-secret',
    bcryptRounds: 4,
  };
  const container = createContainer(cfg, new SilentLogger(), () => NOW);
  return { app: createApp(container), container };
}

/** Регистрирует пользователя и возвращает его токен. */
export async function registerUser(
  app: Express,
  email = 'user@example.com',
  password = 'password123',
): Promise<string> {
  const res = await request(app).post('/api/auth/register').send({ email, password });
  return (res.body as { token: string }).token;
}
