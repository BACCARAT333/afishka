import 'dotenv/config';

export type EventSourceMode = 'auto' | 'fixtures';

export interface AppConfig {
  readonly port: number;
  readonly nodeEnv: string;
  readonly kudagoBaseUrl: string;
  readonly kudagoTimeoutMs: number;
  readonly dbPath: string;
  readonly defaultCity: string;
  readonly eventsCacheTtlMs: number;
  readonly eventSource: EventSourceMode;
}

function toNumber(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Собирает конфигурацию из переменных окружения (отдельной функцией, чтобы её можно было тестировать). */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    port: toNumber(env.PORT, 3000),
    nodeEnv: env.NODE_ENV ?? 'development',
    kudagoBaseUrl: env.KUDAGO_BASE_URL ?? 'https://kudago.com/public-api/v1.4/',
    kudagoTimeoutMs: toNumber(env.KUDAGO_TIMEOUT_MS, 5000),
    dbPath: env.DB_PATH ?? 'data/afishka.sqlite',
    defaultCity: env.DEFAULT_CITY ?? 'spb',
    eventsCacheTtlMs: toNumber(env.EVENTS_CACHE_TTL_MS, 60 * 60 * 1000),
    eventSource: env.EVENT_SOURCE === 'fixtures' ? 'fixtures' : 'auto',
  };
}

export const config: AppConfig = loadConfig();
