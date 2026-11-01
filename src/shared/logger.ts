/** Минимальный интерфейс журнала: сервисы зависят от него, а не от console. */
export interface Logger {
  info(message: string): void;
  warn(message: string, error?: unknown): void;
  error(message: string, error?: unknown): void;
}

function describeError(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

/** Пишет сообщения в консоль с отметкой времени и уровнем. */
export class ConsoleLogger implements Logger {
  public info(message: string): void {
    this.write('INFO', message);
  }

  public warn(message: string, error?: unknown): void {
    this.write('WARN', message, error);
  }

  public error(message: string, error?: unknown): void {
    this.write('ERROR', message, error);
  }

  private write(level: string, message: string, error?: unknown): void {
    const suffix = error === undefined ? '' : ` (${describeError(error)})`;
    // eslint-disable-next-line no-console
    console.log(`${new Date().toISOString()} ${level} ${message}${suffix}`);
  }
}

/** Ничего не пишет: для тестов. */
export class SilentLogger implements Logger {
  public info(): void {}

  public warn(): void {}

  public error(): void {}
}
