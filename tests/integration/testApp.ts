import type { Express } from 'express';
import { createApp } from '../../src/app';
import { loadConfig } from '../../src/config';
import { createContainer, type Container } from '../../src/container';
import { SilentLogger } from '../../src/shared/logger';

/** Фиксированный «сейчас»: данные в fixtures относятся к 2027 году. */
export const NOW = new Date('2026-11-01T00:00:00Z');

/** Приложение для тестов: БД в памяти, только запасные данные из JSON, фиксированное время. */
export function createTestApp(): { app: Express; container: Container } {
  const cfg = { ...loadConfig({}), dbPath: ':memory:', eventSource: 'fixtures' as const };
  const container = createContainer(cfg, new SilentLogger(), () => NOW);
  return { app: createApp(container), container };
}
