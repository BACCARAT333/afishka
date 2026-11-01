import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EventFactory } from '../../src/modules/events/EventFactory';
import { Concert } from '../../src/modules/events/models/Concert';
import { Exhibition } from '../../src/modules/events/models/Exhibition';
import { Movie } from '../../src/modules/events/models/Movie';
import { Performance } from '../../src/modules/events/models/Performance';
import { SqliteEventRepository } from '../../src/modules/events/SqliteEventRepository';
import { type Db, openDatabase } from '../../src/shared/db';
import { makeProps } from './helpers';

const CACHED_AT = new Date('2026-11-01T00:00:00Z');
let db: Db;
let repo: SqliteEventRepository;

beforeEach(() => {
  db = openDatabase(':memory:');
  repo = new SqliteEventRepository(db, new EventFactory());
});
afterEach(() => db.close());

describe('SqliteEventRepository', () => {
  it('сохраняет событие и восстанавливает его вместе с местом', () => {
    const original = new Concert(makeProps({ id: 'c1' }), ['рок', 'панк']);
    repo.saveMany([original], CACHED_AT);

    const found = repo.findById('c1');
    expect(found).toBeInstanceOf(Concert);
    expect(found?.toJSON()).toEqual(original.toJSON());
  });

  it('восстанавливает нужный подкласс и его особые поля', () => {
    repo.saveMany(
      [
        new Concert(makeProps({ id: 'a' }), ['джаз']),
        new Performance(makeProps({ id: 'b' }), 16),
        new Exhibition(makeProps({ id: 'c', endsAt: null }), true),
        new Movie(makeProps({ id: 'd' }), 95),
      ],
      CACHED_AT,
    );

    expect(repo.findById('a')).toBeInstanceOf(Concert);
    expect(repo.findById('b')).toMatchObject({ ageRestriction: 16 });
    expect(repo.findById('c')).toMatchObject({ permanent: true, endsAt: null });
    expect(repo.findById('d')).toMatchObject({ durationMin: 95 });
  });

  it('событие без места сохраняется с venue = null', () => {
    repo.saveMany([new Concert(makeProps({ id: 'nv', venue: null }))], CACHED_AT);
    expect(repo.findById('nv')?.venue).toBeNull();
  });

  it('повторное сохранение обновляет запись, а не дублирует', () => {
    repo.saveMany([new Concert(makeProps({ id: 'u', title: 'Старое' }))], CACHED_AT);
    repo.saveMany([new Concert(makeProps({ id: 'u', title: 'Новое' }))], CACHED_AT);

    expect(repo.findByCity('spb')).toHaveLength(1);
    expect(repo.findById('u')?.title).toBe('Новое');
  });

  it('findByCity возвращает только нужный город, по дате начала', () => {
    repo.saveMany(
      [
        new Concert(
          makeProps({ id: 'late', startsAt: new Date('2026-12-01T10:00:00Z'), endsAt: null }),
        ),
        new Concert(
          makeProps({ id: 'early', startsAt: new Date('2026-11-05T10:00:00Z'), endsAt: null }),
        ),
        new Concert(makeProps({ id: 'other', city: 'msk', venue: null })),
      ],
      CACHED_AT,
    );

    expect(repo.findByCity('spb').map((e) => e.id)).toEqual(['early', 'late']);
    expect(repo.findByCity('msk').map((e) => e.id)).toEqual(['other']);
    expect(repo.findByCity('nsk')).toEqual([]);
  });

  it('findById неизвестного события даёт null', () => {
    expect(repo.findById('nope')).toBeNull();
  });

  it('пропускает испорченные записи', () => {
    repo.saveMany([new Concert(makeProps({ id: 'ok' }))], CACHED_AT);
    db.prepare(
      `INSERT INTO events (id, title, description, city, category, starts_at, is_free, extra, cached_at)
       VALUES ('bad', 'Что-то', '', 'spb', 'unknown-category', '2026-11-10T10:00:00.000Z', 0, '{}', ?)`,
    ).run(CACHED_AT.toISOString());

    expect(repo.findByCity('spb').map((e) => e.id)).toEqual(['ok']);
    expect(repo.findById('bad')).toBeNull();
  });

  it('помнит время последнего обновления города', () => {
    expect(repo.getSyncedAt('spb')).toBeNull();
    repo.markSynced('spb', CACHED_AT);
    expect(repo.getSyncedAt('spb')).toEqual(CACHED_AT);

    const later = new Date('2026-11-02T00:00:00Z');
    repo.markSynced('spb', later);
    expect(repo.getSyncedAt('spb')).toEqual(later);
    expect(repo.getSyncedAt('msk')).toBeNull();
  });
});
