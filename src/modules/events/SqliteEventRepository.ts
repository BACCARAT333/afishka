import { ValidationError } from '../../shared/errors';
import type { Db } from '../../shared/db';
import { Venue } from '../venues/Venue';
import { EventFactory, type EventDraft } from './EventFactory';
import type { IEventRepository } from './IEventRepository';
import type { Event } from './models/Event';

interface EventRow {
  id: string;
  title: string;
  description: string;
  city: string;
  category: string;
  starts_at: string;
  ends_at: string | null;
  is_free: number;
  price: string | null;
  image_url: string | null;
  extra: string;
  venue_id: string | null;
  venue_name: string | null;
  venue_address: string | null;
  venue_city: string | null;
  venue_lat: number | null;
  venue_lon: number | null;
}

type ExtraFields = Pick<EventDraft, 'genres' | 'ageRestriction' | 'permanent' | 'durationMin'>;

/** Поля, общие для всех событий; всё остальное из toJSON() — «особые» поля подклассов. */
const BASE_KEYS = new Set([
  'id',
  'title',
  'description',
  'city',
  'category',
  'startsAt',
  'endsAt',
  'isFree',
  'price',
  'imageUrl',
  'venue',
]);

const SELECT_EVENT = `
  SELECT e.id, e.title, e.description, e.city, e.category, e.starts_at, e.ends_at,
         e.is_free, e.price, e.image_url, e.extra,
         v.id AS venue_id, v.name AS venue_name, v.address AS venue_address,
         v.city AS venue_city, v.latitude AS venue_lat, v.longitude AS venue_lon
  FROM events e
  LEFT JOIN venues v ON v.id = e.venue_id`;

/** Репозиторий (паттерн Repository) на SQLite. Подкласс события восстанавливается через фабрику. */
export class SqliteEventRepository implements IEventRepository {
  public constructor(
    private readonly db: Db,
    private readonly factory: EventFactory,
  ) {}

  public saveMany(events: Event[], cachedAt: Date): void {
    const upsertVenue = this.db.prepare(
      `INSERT INTO venues (id, name, address, city, latitude, longitude)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET name = excluded.name, address = excluded.address,
         city = excluded.city, latitude = excluded.latitude, longitude = excluded.longitude`,
    );
    const upsertEvent = this.db.prepare(
      `INSERT INTO events (id, title, description, city, category, starts_at, ends_at,
         is_free, price, image_url, venue_id, extra, cached_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET title = excluded.title, description = excluded.description,
         city = excluded.city, category = excluded.category, starts_at = excluded.starts_at,
         ends_at = excluded.ends_at, is_free = excluded.is_free, price = excluded.price,
         image_url = excluded.image_url, venue_id = excluded.venue_id, extra = excluded.extra,
         cached_at = excluded.cached_at`,
    );

    const saveAll = this.db.transaction((items: Event[]) => {
      for (const event of items) {
        const venue = event.venue;
        if (venue !== null) {
          upsertVenue.run(
            venue.id,
            venue.name,
            venue.address,
            venue.city,
            venue.latitude,
            venue.longitude,
          );
        }
        upsertEvent.run(
          event.id,
          event.title,
          event.description,
          event.city,
          event.category,
          event.startsAt.toISOString(),
          event.endsAt?.toISOString() ?? null,
          event.isFree ? 1 : 0,
          event.price,
          event.imageUrl,
          venue?.id ?? null,
          JSON.stringify(this.extraOf(event)),
          cachedAt.toISOString(),
        );
      }
    });
    saveAll(events);
  }

  public findById(id: string): Event | null {
    const row = this.db.prepare(`${SELECT_EVENT} WHERE e.id = ?`).get(id) as EventRow | undefined;
    return row === undefined ? null : this.toEvent(row);
  }

  public findByCity(city: string): Event[] {
    const rows = this.db
      .prepare(`${SELECT_EVENT} WHERE e.city = ? ORDER BY e.starts_at, e.id`)
      .all(city) as EventRow[];
    const events: Event[] = [];
    for (const row of rows) {
      const event = this.toEvent(row);
      if (event !== null) events.push(event);
    }
    return events;
  }

  public getSyncedAt(city: string): Date | null {
    const row = this.db.prepare('SELECT synced_at FROM sync_state WHERE city = ?').get(city) as
      { synced_at: string } | undefined;
    return row === undefined ? null : new Date(row.synced_at);
  }

  public markSynced(city: string, at: Date): void {
    this.db
      .prepare(
        `INSERT INTO sync_state (city, synced_at) VALUES (?, ?)
         ON CONFLICT(city) DO UPDATE SET synced_at = excluded.synced_at`,
      )
      .run(city, at.toISOString());
  }

  private extraOf(event: Event): Record<string, unknown> {
    const entries = Object.entries(event.toJSON()).filter(([key]) => !BASE_KEYS.has(key));
    return Object.fromEntries(entries);
  }

  /** Строка БД → объект нужного подкласса. Испорченная запись пропускается (null). */
  private toEvent(row: EventRow): Event | null {
    const venue =
      row.venue_id !== null && row.venue_name !== null
        ? new Venue({
            id: row.venue_id,
            name: row.venue_name,
            address: row.venue_address ?? '',
            city: row.venue_city ?? row.city,
            latitude: row.venue_lat,
            longitude: row.venue_lon,
          })
        : null;

    try {
      const extra = JSON.parse(row.extra) as ExtraFields;
      return this.factory.create({
        id: row.id,
        title: row.title,
        description: row.description,
        city: row.city,
        category: row.category,
        startsAt: new Date(row.starts_at),
        endsAt: row.ends_at === null ? null : new Date(row.ends_at),
        isFree: row.is_free === 1,
        price: row.price,
        imageUrl: row.image_url,
        venue,
        ...extra,
      });
    } catch (error) {
      if (error instanceof ValidationError || error instanceof SyntaxError) return null;
      throw error;
    }
  }
}
