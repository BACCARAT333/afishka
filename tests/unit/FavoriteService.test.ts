import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EventFactory } from '../../src/modules/events/EventFactory';
import { Concert } from '../../src/modules/events/models/Concert';
import { SqliteEventRepository } from '../../src/modules/events/SqliteEventRepository';
import { FavoriteService } from '../../src/modules/favorites/FavoriteService';
import { SqliteFavoriteRepository } from '../../src/modules/favorites/SqliteFavoriteRepository';
import { type Db, openDatabase } from '../../src/shared/db';
import { NotFoundError } from '../../src/shared/errors';
import { makeProps } from './helpers';

let db: Db;
let service: FavoriteService;
let tick: number;

beforeEach(() => {
  db = openDatabase(':memory:');
  const events = new SqliteEventRepository(db, new EventFactory());
  events.saveMany(
    [
      new Concert(makeProps({ id: 'e1', title: 'Первое' })),
      new Concert(makeProps({ id: 'e2', title: 'Второе' })),
    ],
    new Date('2026-11-01T00:00:00Z'),
  );
  for (const id of ['u1', 'u2']) {
    db.prepare('INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)').run(
      id,
      `${id}@example.com`,
      'hash',
      '2026-11-01T00:00:00.000Z',
    );
  }
  tick = 0;
  // Каждое обращение к часам даёт следующую секунду: порядок добавления различим
  service = new FavoriteService(
    new SqliteFavoriteRepository(db),
    events,
    () => new Date(Date.UTC(2026, 10, 1, 0, 0, tick++)),
  );
});
afterEach(() => db.close());

describe('FavoriteService', () => {
  it('добавляет и показывает события, новые сверху', () => {
    expect(service.add('u1', 'e1')).toBe(true);
    expect(service.add('u1', 'e2')).toBe(true);
    expect(service.list('u1').map((e) => e.id)).toEqual(['e2', 'e1']);
  });

  it('повторное добавление не создаёт дубликат', () => {
    service.add('u1', 'e1');
    expect(service.add('u1', 'e1')).toBe(false);
    expect(service.list('u1')).toHaveLength(1);
  });

  it('добавить несуществующее событие нельзя', () => {
    expect(() => service.add('u1', 'нет-такого')).toThrow(NotFoundError);
  });

  it('у каждого пользователя своё избранное', () => {
    service.add('u1', 'e1');
    expect(service.list('u2')).toEqual([]);
  });

  it('удаляет из избранного; повторное удаление — NotFoundError', () => {
    service.add('u1', 'e1');
    service.remove('u1', 'e1');
    expect(service.list('u1')).toEqual([]);
    expect(() => service.remove('u1', 'e1')).toThrow(NotFoundError);
  });
});
