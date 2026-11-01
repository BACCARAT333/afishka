import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, registerUser } from './testApp';

let ctx = createTestApp();
beforeEach(() => {
  ctx.container.close();
  ctx = createTestApp();
});
afterAll(() => ctx.container.close());

const auth = (token: string): [string, string] => ['Authorization', `Bearer ${token}`];

describe('защита маршрутов избранного', () => {
  it('без токена — 401', async () => {
    const res = await request(ctx.app).get('/api/favorites');
    expect(res.status).toBe(401);
    expect(res.body.error.status).toBe(401);
  });

  it.each([['Bearer garbage'], ['Basic abc'], ['tokenwithoutscheme']])(
    'неверный заголовок «%s» — 401',
    async (header) => {
      const res = await request(ctx.app).get('/api/favorites').set('Authorization', header);
      expect(res.status).toBe(401);
    },
  );
});

describe('избранное', () => {
  it('добавить, посмотреть, удалить', async () => {
    const token = await registerUser(ctx.app);
    await request(ctx.app).get('/api/events'); // заполняет кэш событий

    const added = await request(ctx.app)
      .post('/api/favorites/1')
      .set(...auth(token));
    expect(added.status).toBe(201);

    const again = await request(ctx.app)
      .post('/api/favorites/1')
      .set(...auth(token));
    expect(again.status).toBe(200);

    const list = await request(ctx.app)
      .get('/api/favorites')
      .set(...auth(token));
    expect(list.status).toBe(200);
    expect(list.body.items.map((e: { id: string }) => e.id)).toEqual(['1']);

    const removed = await request(ctx.app)
      .delete('/api/favorites/1')
      .set(...auth(token));
    expect(removed.status).toBe(204);

    const removedAgain = await request(ctx.app)
      .delete('/api/favorites/1')
      .set(...auth(token));
    expect(removedAgain.status).toBe(404);

    const empty = await request(ctx.app)
      .get('/api/favorites')
      .set(...auth(token));
    expect(empty.body.items).toEqual([]);
  });

  it('несуществующее событие — 404', async () => {
    const token = await registerUser(ctx.app);
    const res = await request(ctx.app)
      .post('/api/favorites/no-such-event')
      .set(...auth(token));
    expect(res.status).toBe(404);
  });

  it('у каждого пользователя своё избранное', async () => {
    const first = await registerUser(ctx.app, 'first@example.com');
    const second = await registerUser(ctx.app, 'second@example.com');
    await request(ctx.app).get('/api/events');
    await request(ctx.app)
      .post('/api/favorites/2')
      .set(...auth(first));

    const res = await request(ctx.app)
      .get('/api/favorites')
      .set(...auth(second));
    expect(res.body.items).toEqual([]);
  });
});
