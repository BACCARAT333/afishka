import type { Event, EventCategory } from './models/Event';

export interface EventsQuery {
  city: string;
  category?: EventCategory;
  dateFrom?: Date;
  dateTo?: Date;
  free?: boolean;
  page?: number;
  pageSize?: number;
}

/** Источник событий. Сервисы зависят от интерфейса, а не от конкретного API. */
export interface EventSource {
  fetchEvents(query: EventsQuery): Promise<Event[]>;
}
