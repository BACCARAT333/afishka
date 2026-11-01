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
