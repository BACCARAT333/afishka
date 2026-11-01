import { ValidationError } from '../../shared/errors';

export interface Credentials {
  email: string;
  password: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
/** bcrypt учитывает только первые 72 байта пароля. */
const MAX_PASSWORD_BYTES = 72;

function readFields(body: unknown): { email: unknown; password: unknown } {
  if (typeof body !== 'object' || body === null) {
    throw new ValidationError('Ожидается JSON с полями email и password');
  }
  const record = body as Record<string, unknown>;
  return { email: record.email, password: record.password };
}

function readEmail(value: unknown): string {
  if (typeof value !== 'string') throw new ValidationError('Поле email обязательно');
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    throw new ValidationError('Некорректный email');
  }
  return email;
}

/** Проверка данных регистрации: надёжность пароля тоже проверяется. */
export function parseRegistration(body: unknown): Credentials {
  const { email, password } = readFields(body);
  const checkedEmail = readEmail(email);
  if (typeof password !== 'string') throw new ValidationError('Поле password обязательно');
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new ValidationError(`Пароль должен быть не короче ${MIN_PASSWORD_LENGTH} символов`);
  }
  if (Buffer.byteLength(password, 'utf8') > MAX_PASSWORD_BYTES) {
    throw new ValidationError(`Пароль слишком длинный (не более ${MAX_PASSWORD_BYTES} байт)`);
  }
  return { email: checkedEmail, password };
}

/** Для входа достаточно, чтобы поля были заполнены: правила пароля тут не раскрываем. */
export function parseLogin(body: unknown): Credentials {
  const { email, password } = readFields(body);
  if (typeof password !== 'string' || password === '') {
    throw new ValidationError('Поле password обязательно');
  }
  return { email: readEmail(email), password };
}
