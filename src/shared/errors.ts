export class HttpError extends Error {
  public constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export class NotFoundError extends HttpError {
  public constructor(message = 'Не найдено') {
    super(404, message);
  }
}

export class ValidationError extends HttpError {
  public constructor(message: string) {
    super(400, message);
    this.name = 'ValidationError';
  }
}

/** Ошибка внешней интеграции (недоступен или вернул плохой ответ сторонний сервис). */
export class IntegrationError extends HttpError {
  public constructor(message: string, status = 502) {
    super(status, message);
    this.name = 'IntegrationError';
  }
}

export class UnauthorizedError extends HttpError {
  public constructor(message = 'Требуется авторизация') {
    super(401, message);
    this.name = 'UnauthorizedError';
  }
}

export class ConflictError extends HttpError {
  public constructor(message: string) {
    super(409, message);
    this.name = 'ConflictError';
  }
}
