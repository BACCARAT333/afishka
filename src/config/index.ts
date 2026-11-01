import 'dotenv/config';

export interface AppConfig {
  readonly port: number;
  readonly nodeEnv: string;
  readonly kudagoBaseUrl: string;
  readonly kudagoTimeoutMs: number;
}

export const config: AppConfig = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  kudagoBaseUrl: process.env.KUDAGO_BASE_URL ?? 'https://kudago.com/public-api/v1.4/',
  kudagoTimeoutMs: Number(process.env.KUDAGO_TIMEOUT_MS ?? 5000),
};
