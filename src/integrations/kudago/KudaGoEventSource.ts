import type { EventSource, EventsQuery } from '../../modules/events/EventSource';
import type { Event } from '../../modules/events/models/Event';
import type { KudaGoAdapter } from './KudaGoAdapter';
import type { KudaGoClient } from './KudaGoClient';

const toUnix = (date: Date): number => Math.floor(date.getTime() / 1000);

/** Источник событий на основе реального API KudaGo. */
export class KudaGoEventSource implements EventSource {
  public constructor(
    private readonly client: KudaGoClient,
    private readonly adapter: KudaGoAdapter,
  ) {}

  public async fetchEvents(query: EventsQuery): Promise<Event[]> {
    const response = await this.client.getEvents({
      location: query.city,
      categories: query.category,
      actualSince: toUnix(query.dateFrom ?? new Date()),
      actualUntil: query.dateTo ? toUnix(query.dateTo) : undefined,
      isFree: query.free,
      page: query.page,
      pageSize: query.pageSize,
    });
    return this.adapter.toEvents(response.results, query.city);
  }
}
