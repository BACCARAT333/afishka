import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EventFactory } from '../../src/modules/events/EventFactory';
import type { EventSource, EventsQuery } from '../../src/modules/events/EventSource';
import { EventService, type EventListQuery } from '../../src/modules/events/EventService';
import { Concert } from '../../src/modules/events/models/Concert';
import type { Event } from '../../src/modules/events/models/Event';
import { Movie } from '../../src/modules/events/models/Movie';
import { SqliteEventRepository } from '../../src/modules/events/SqliteEventRepository';
import { IntegrationError, NotFoundError } from '../../src/shared/errors';
import { type Db, openDatabase } from '../../src/shared/db';
import { SilentLogger } from '../../src/shared/logger';
import { makeProps } from './helpers';

/** Управляемый источник: считает вызовы, умеет «падать» и отдавать заданные события. */
class StubSource implements EventSource {
  public calls: EventsQuery[] = [];
  public failing = false;
  public events: Event[] = [];

  public fetchEvents(query: EventsQuery): Promise<Event[]> {
    this.calls.push(query);
    if (this.failing) return Promise.reject(new IntegrationError('нет связи'));
    return Promise.resolve(this.events);
  }
}

const TTL = 60_000;
const baseQuery: EventListQuery = { city: 'spb', sort: 'date', page: 1, pageSize: 20 };

let db: Db;
let source: StubSource;
let now: Date;
let service: EventService;

beforeEach(() => {
  db = openDatabase(':memory:');
  source = new StubSource();
  now = new Date('2026-11-01T00:00:00Z');
  source.events = [
    new Concert(makeProps({ id: '1', title: 'Рок' })),
    new Movie(
      makeProps({
        id: '2',
        title: 'Кино',
        isFree: true,
        startsAt: new Date('2026-12-01T18:00:00Z'),
        endsAt: null,
      }),
    ),
  ];
  service = new EventService(
    source,
    new SqliteEventRepository(db, new EventFactory()),
    { cacheTtlMs: TTL, clock: () => now },
    new SilentLogger(),
  );
});
afterEach(() => db.close());

describe('EventService.list', () => {
  it('первый запрос обновляет кэш из источника и применяет фильтры', async () => {
    const all = await service.list(baseQuery);
    expect(all.items.map((e) => e.id)).toEqual(['1', '2']);
    expect(source.calls).toEqual([{ city: 'spb', pageSize: 100 }]);

    const free = await service.list({ ...baseQuery, free: true });
    expect(free.items.map((e) => e.id)).toEqual(['2']);
  });

  it('пока кэш свежий, источник не вызывается', async () => {
    await service.list(baseQuery);
    now = new Date(now.getTime() + TTL - 1);
    await service.list(baseQuery);
    expect(source.calls).toHaveLength(1);
  });

  it('после истечения срока кэш обновляется', async () => {
    await service.list(baseQuery);
    now = new Date(now.getTime() + TTL);
    await service.list(baseQuery);
    expect(source.calls).toHaveLength(2);
  });

  it('одновременные запросы делают одно обновление', async () => {
    await Promise.all([service.list(baseQuery), service.list(baseQuery), service.list(baseQuery)]);
    expect(source.calls).toHaveLength(1);
  });

  it('при сбое источника отдаёт устаревший кэш', async () => {
    await service.list(baseQuery);
    now = new Date(now.getTime() + TTL * 2);
    source.failing = true;

    const page = await service.list(baseQuery);
    expect(page.items.map((e) => e.id)).toEqual(['1', '2']);
  });

  it('при сбое источника и пустом кэше пробрасывает ошибку', async () => {
    source.failing = true;
    await expect(service.list(baseQuery)).rejects.toBeInstanceOf(IntegrationError);
  });

  it('прошедшие события не попадают в список', async () => {
    now = new Date('2026-11-20T00:00:00Z');
    const page = await service.list(baseQuery);
    expect(page.items.map((e) => e.id)).toEqual(['2']);
  });

  it('пагинация и сортировка по названию', async () => {
    const first = await service.list({ ...baseQuery, sort: 'title', pageSize: 1 });
    expect(first.items.map((e) => e.id)).toEqual(['2']);
    expect(first).toMatchObject({ total: 2, totalPages: 2, page: 1, pageSize: 1 });

    const second = await service.list({ ...baseQuery, sort: 'title', pageSize: 1, page: 2 });
    expect(second.items.map((e) => e.id)).toEqual(['1']);

    const beyond = await service.list({ ...baseQuery, pageSize: 1, page: 5 });
    expect(beyond.items).toEqual([]);
  });

  it('пустой ответ источника — пустая страница, а не ошибка', async () => {
    source.events = [];
    const page = await service.list(baseQuery);
    expect(page).toMatchObject({ items: [], total: 0, totalPages: 0 });
  });
});

describe('EventService.getById', () => {
  it('находит событие из кэша', async () => {
    await service.list(baseQuery);
    expect(service.getById('1').title).toBe('Рок');
  });

  it('неизвестный id — NotFoundError', () => {
    expect(() => service.getById('999')).toThrow(NotFoundError);
  });
});
