import { ValidationError } from '../../shared/errors';
import type { EventFactory } from '../../modules/events/EventFactory';
import type { Event, EventCategory } from '../../modules/events/models/Event';
import { Venue } from '../../modules/venues/Venue';
import type { KudaGoDate, KudaGoEventRaw, KudaGoPlace } from './types';

/** KudaGo помечает «бессрочные» даты числами вроде -62135433000 или 253370754000. */
const MAX_REAL_TIMESTAMP_SEC = 4_000_000_000;

interface PickedCategory {
  name: EventCategory;
  permanent: boolean;
}

/** Адаптер (паттерн Adapter): ответ KudaGo → внутренние классы Event через фабрику. */
export class KudaGoAdapter {
  public constructor(private readonly factory: EventFactory) {}

  /** Преобразует список; события неподдерживаемых категорий и с неверными данными пропускает. */
  public toEvents(raws: KudaGoEventRaw[], city: string, now: Date = new Date()): Event[] {
    const events: Event[] = [];
    for (const raw of raws) {
      const event = this.toEvent(raw, city, now);
      if (event !== null) events.push(event);
    }
    return events;
  }

  public toEvent(raw: KudaGoEventRaw, city: string, now: Date = new Date()): Event | null {
    const category = this.pickCategory(raw.categories ?? []);
    if (category === null) return null;

    const { startsAt, endsAt } = this.pickDates(raw.dates ?? [], now);

    try {
      return this.factory.create({
        id: String(raw.id),
        title: raw.title,
        description: raw.description ?? '',
        city,
        startsAt,
        endsAt,
        isFree: raw.is_free === true,
        price: raw.price ? raw.price : null,
        imageUrl: raw.images?.[0]?.image ?? null,
        venue: this.toVenue(raw.place, city),
        category: category.name,
        genres: category.name === 'concert' ? (raw.tags ?? []) : undefined,
        ageRestriction: parseAge(raw.age_restriction),
        permanent: category.permanent,
      });
    } catch (error) {
      if (error instanceof ValidationError) return null;
      throw error;
    }
  }

  private pickCategory(categories: string[]): PickedCategory | null {
    if (categories.includes('permanent-exhibitions')) {
      return { name: 'exhibition', permanent: true };
    }
    const name = categories.find((item): item is EventCategory => this.factory.supports(item));
    return name === undefined ? null : { name, permanent: false };
  }

  /** Берёт ближайший не закончившийся сеанс; если все прошли — первый. */
  private pickDates(dates: KudaGoDate[], now: Date): { startsAt: Date; endsAt: Date | null } {
    const ranges = dates.map((d) => ({ start: toDate(d.start), end: toDate(d.end) }));
    const current = ranges.find((r) => (r.end ?? r.start ?? now) >= now) ?? ranges[0];

    const startsAt = current?.start ?? now;
    const endsAt = current?.end ?? null;
    return { startsAt, endsAt: endsAt !== null && endsAt < startsAt ? null : endsAt };
  }

  private toVenue(place: KudaGoPlace | null | undefined, city: string): Venue | null {
    if (!place || !place.title) return null;
    return new Venue({
      id: String(place.id),
      name: place.title,
      address: place.address ?? '',
      city,
      latitude: place.coords?.lat ?? null,
      longitude: place.coords?.lon ?? null,
    });
  }
}

function toDate(seconds: number | null | undefined): Date | null {
  if (seconds === null || seconds === undefined) return null;
  if (seconds <= 0 || seconds > MAX_REAL_TIMESTAMP_SEC) return null;
  return new Date(seconds * 1000);
}

function parseAge(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const age = parseInt(String(value), 10);
  return Number.isNaN(age) ? null : age;
}
