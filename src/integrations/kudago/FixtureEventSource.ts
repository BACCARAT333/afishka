import type { EventSource, EventsQuery } from '../../modules/events/EventSource';
import type { Event } from '../../modules/events/models/Event';
import type { KudaGoAdapter } from './KudaGoAdapter';
import fixtureData from './fixtures/events.json';
import type { KudaGoEventRaw } from './types';

const DEFAULT_PAGE_SIZE = 20;

/** Запасной источник: читает заранее сохранённые данные в формате KudaGo и фильтрует их сам. */
export class FixtureEventSource implements EventSource {
  public constructor(
    private readonly adapter: KudaGoAdapter,
    private readonly raws: KudaGoEventRaw[] = fixtureData as unknown as KudaGoEventRaw[],
    private readonly clock: () => Date = () => new Date(),
  ) {}

  public fetchEvents(query: EventsQuery): Promise<Event[]> {
    const now = this.clock();
    const inCity = this.raws.filter((raw) => raw.place?.location === query.city);

    const events = this.adapter
      .toEvents(inCity, query.city, now)
      .filter((event) => query.category === undefined || event.category === query.category)
      .filter((event) => query.free === undefined || event.isFree === query.free)
      .filter((event) => event.isActiveAt(query.dateFrom ?? now))
      .filter((event) => query.dateTo === undefined || event.startsAt <= query.dateTo);

    const page = query.page ?? 1;
    const size = query.pageSize ?? DEFAULT_PAGE_SIZE;
    return Promise.resolve(events.slice((page - 1) * size, page * size));
  }
}
