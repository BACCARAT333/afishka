import 'dotenv/config';
import { resolve } from 'node:path';

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
  readonly jwtSecret: string;
  readonly jwtExpiresInSec: number;
  readonly bcryptRounds: number;
  /** Папка со сборкой фронтенда (web/dist): если она есть, сервер отдаёт сайт сам. */
  readonly webDistDir: string;
  /** Тестовый пользователь, который создаётся при запуске (для демонстрации и проверки). */
  readonly seedUser: { readonly email: string; readonly password: string } | null;
}

function toNumber(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Собирает конфигурацию из переменных окружения (отдельной функцией, чтобы её можно было тестировать). */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const nodeEnv = env.NODE_ENV ?? 'development';
  if (nodeEnv === 'production' && (env.JWT_SECRET ?? '') === '') {
    throw new Error('В production нужно задать JWT_SECRET');
  }
  const seedEmail = (env.SEED_USER_EMAIL ?? '').trim();
  const seedPassword = env.SEED_USER_PASSWORD ?? '';
  return {
    port: toNumber(env.PORT, 3000),
    nodeEnv,
    kudagoBaseUrl: env.KUDAGO_BASE_URL ?? 'https://kudago.com/public-api/v1.4/',
    kudagoTimeoutMs: toNumber(env.KUDAGO_TIMEOUT_MS, 5000),
    dbPath: env.DB_PATH ?? 'data/afishka.sqlite',
    defaultCity: env.DEFAULT_CITY ?? 'spb',
    eventsCacheTtlMs: toNumber(env.EVENTS_CACHE_TTL_MS, 60 * 60 * 1000),
    eventSource: env.EVENT_SOURCE === 'fixtures' ? 'fixtures' : 'auto',
    jwtSecret: env.JWT_SECRET ?? 'dev-only-secret-change-me',
    jwtExpiresInSec: toNumber(env.JWT_EXPIRES_IN_SEC, 7 * 24 * 60 * 60),
    bcryptRounds: toNumber(env.BCRYPT_ROUNDS, 10),
    webDistDir: resolve(env.WEB_DIST_DIR ?? 'web/dist'),
    seedUser:
      seedEmail !== '' && seedPassword !== '' ? { email: seedEmail, password: seedPassword } : null,
  };
}

export const config: AppConfig = loadConfig();
