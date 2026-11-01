import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp } from './testApp';

let ctx = createTestApp();
beforeEach(() => {
  ctx.container.close();
  ctx = createTestApp();
});
afterAll(() => ctx.container.close());

const credentials = { email: 'User@Example.com', password: 'password123' };

describe('POST /api/auth/register', () => {
  it('создаёт пользователя: 201, токен и без хэша пароля', async () => {
    const res = await request(ctx.app).post('/api/auth/register').send(credentials);
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('user@example.com');
    expect(typeof res.body.token).toBe('string');
    expect(JSON.stringify(res.body)).not.toMatch(/password/i);
  });

  it('повторная регистрация даёт 409', async () => {
    await request(ctx.app).post('/api/auth/register').send(credentials);
    const res = await request(ctx.app).post('/api/auth/register').send(credentials);
    expect(res.status).toBe(409);
    expect(res.body.error.status).toBe(409);
  });

  it.each([
    [{}],
    [{ email: 'bad', password: 'password123' }],
    [{ email: 'user@example.com', password: 'short' }],
  ])('неверные данные %j дают 400', async (body) => {
    const res = await request(ctx.app).post('/api/auth/register').send(body);
    expect(res.status).toBe(400);
    expect(res.body.error.status).toBe(400);
  });

  it('сломанный JSON даёт 400, а не 500', async () => {
    const res = await request(ctx.app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send('{"email": ');
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('верные данные дают 200 и токен', async () => {
    await request(ctx.app).post('/api/auth/register').send(credentials);
    const res = await request(ctx.app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
  });

  it('неверный пароль и неизвестный email дают 401 с одним сообщением', async () => {
    await request(ctx.app).post('/api/auth/register').send(credentials);
    const wrong = await request(ctx.app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'wrong-password' });
    const unknown = await request(ctx.app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.error.message).toBe(unknown.body.error.message);
  });

  it('пустое тело даёт 400', async () => {
    const res = await request(ctx.app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });
});
