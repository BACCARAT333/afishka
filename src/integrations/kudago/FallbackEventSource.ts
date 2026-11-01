import type { EventSource, EventsQuery } from '../../modules/events/EventSource';
import type { Event } from '../../modules/events/models/Event';

/** Декоратор: пробует основной источник, при любой ошибке переключается на запасной. */
export class FallbackEventSource implements EventSource {
  public constructor(
    private readonly primary: EventSource,
    private readonly fallback: EventSource,
    private readonly onFallback: (error: unknown) => void = () => undefined,
  ) {}

  public async fetchEvents(query: EventsQuery): Promise<Event[]> {
    try {
      return await this.primary.fetchEvents(query);
    } catch (error) {
      this.onFallback(error);
      return this.fallback.fetchEvents(query);
    }
  }
}
