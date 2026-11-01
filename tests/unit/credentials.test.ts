import { describe, expect, it } from 'vitest';
import { parseLogin, parseRegistration } from '../../src/modules/users/credentials';
import { ValidationError } from '../../src/shared/errors';

describe('parseRegistration', () => {
  it('приводит email к нижнему регистру и обрезает пробелы', () => {
    expect(parseRegistration({ email: '  User@Example.COM ', password: 'password123' })).toEqual({
      email: 'user@example.com',
      password: 'password123',
    });
  });

  it.each([
    [null],
    ['строка'],
    [{}],
    [{ email: 'user@example.com' }],
    [{ password: 'password123' }],
    [{ email: 'без-собаки', password: 'password123' }],
    [{ email: 'a@b', password: 'password123' }],
    [{ email: 123, password: 'password123' }],
    [{ email: 'user@example.com', password: 'short' }],
    [{ email: 'user@example.com', password: 12345678 }],
    [{ email: 'user@example.com', password: 'я'.repeat(40) }],
    [{ email: `${'a'.repeat(250)}@example.com`, password: 'password123' }],
  ])('отклоняет %j', (body) => {
    expect(() => parseRegistration(body)).toThrow(ValidationError);
  });
});

describe('parseLogin', () => {
  it('принимает любой непустой пароль', () => {
    expect(parseLogin({ email: 'user@example.com', password: 'x' })).toEqual({
      email: 'user@example.com',
      password: 'x',
    });
  });

  it.each([
    [{ email: 'user@example.com', password: '' }],
    [{ email: 'bad', password: 'x' }],
    [undefined],
  ])('отклоняет %j', (body) => {
    expect(() => parseLogin(body)).toThrow(ValidationError);
  });
});
