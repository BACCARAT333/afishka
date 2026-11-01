import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp } from './testApp';

let ctx = createTestApp();

beforeEach(() => {
  ctx.container.close();
  ctx = createTestApp();
});
afterAll(() => ctx.container.close());

const ids = (body: { items: Array<{ id: string }> }): string[] => body.items.map((e) => e.id);

describe('GET /api/events', () => {
  it('по умолчанию отдаёт события города spb по дате', async () => {
    const res = await request(ctx.app).get('/api/events');
    expect(res.status).toBe(200);
    expect(ids(res.body)).toEqual(['4', '3', '2', '1', '5']);
    expect(res.body).toMatchObject({ page: 1, pageSize: 20, total: 5, totalPages: 1 });
  });

  it('в элементах есть поля подкласса и место', async () => {
    const res = await request(ctx.app).get('/api/events?category=concert');
    expect(res.body.items[0]).toMatchObject({
      id: '1',
      category: 'concert',
      venue: { name: 'Клуб «Космонавт»' },
    });
    expect(res.body.items[0].genres).toBeInstanceOf(Array);
  });

  it('фильтр по категории', async () => {
    const res = await request(ctx.app).get('/api/events?category=theater');
    expect(ids(res.body)).toEqual(['2']);
  });

  it('фильтр «только бесплатные»', async () => {
    const res = await request(ctx.app).get('/api/events?free=true');
    expect(ids(res.body)).toEqual(['3']);
  });

  it('фильтр по периоду дат', async () => {
    const res = await request(ctx.app).get('/api/events?dateTo=2027-02-15');
    expect(ids(res.body)).toEqual(['4', '3']);

    // Выставки, которые идут в этот период, тоже попадают в выборку
    const march = await request(ctx.app).get('/api/events?dateFrom=2027-03-01&dateTo=2027-03-31');
    expect(ids(march.body)).toEqual(['4', '3', '1']);

    const april = await request(ctx.app).get('/api/events?dateFrom=2027-04-01&dateTo=2027-04-30');
    expect(ids(april.body)).toEqual(['4', '3', '5']);
  });

  it('поиск по тексту без учёта регистра', async () => {
    const byTitle = await request(ctx.app).get('/api/events?q=XVIII');
    expect(ids(byTitle.body)).toEqual(['4']);

    const byVenue = await request(ctx.app).get('/api/events?q=космонавт');
    expect(ids(byVenue.body)).toEqual(['1']);
  });

  it('пагинация', async () => {
    const res = await request(ctx.app).get('/api/events?pageSize=2&page=3');
    expect(ids(res.body)).toEqual(['5']);
    expect(res.body).toMatchObject({ page: 3, total: 5, totalPages: 3 });
  });

  it('сортировка по названию', async () => {
    const res = await request(ctx.app).get('/api/events?sort=title');
    const titles = res.body.items.map((e: { title: string }) => e.title);
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b, 'ru')));
  });

  it('другой город и город без данных', async () => {
    const msk = await request(ctx.app).get('/api/events?city=msk');
    expect(ids(msk.body)).toEqual(['7', '8']);

    const none = await request(ctx.app).get('/api/events?city=nsk');
    expect(none.status).toBe(200);
    expect(none.body.total).toBe(0);
  });

  it.each([
    ['category=opera'],
    ['free=maybe'],
    ['page=0'],
    ['pageSize=1000'],
    ['dateFrom=вчера'],
    ['dateFrom=2027-03-01&dateTo=2027-02-01'],
    ['sort=price'],
    ['city=Санкт-Петербург'],
  ])('неверные параметры (%s) дают 400 в едином формате', async (query) => {
    const res = await request(ctx.app).get(`/api/events?${query}`);
    expect(res.status).toBe(400);
    expect(res.body.error.status).toBe(400);
    expect(typeof res.body.error.message).toBe('string');
  });
});

describe('GET /api/events/:id', () => {
  it('отдаёт событие, которое уже попало в кэш', async () => {
    await request(ctx.app).get('/api/events');
    const res = await request(ctx.app).get('/api/events/3');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: '3', category: 'exhibition', isFree: true });
  });

  it('неизвестный id даёт 404', async () => {
    const res = await request(ctx.app).get('/api/events/unknown');
    expect(res.status).toBe(404);
    expect(res.body.error.status).toBe(404);
  });
});
