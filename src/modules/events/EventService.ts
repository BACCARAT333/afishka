import type { Logger } from '../../shared/logger';
import { NotFoundError } from '../../shared/errors';
import type { EventSource } from './EventSource';
import type { IEventRepository } from './IEventRepository';
import type { Event, EventCategory } from './models/Event';
import { buildFilters, getSortStrategy, type SortKey } from './strategies';

export interface EventListQuery {
  city: string;
  category?: EventCategory;
  dateFrom?: Date;
  dateTo?: Date;
  free?: boolean;
  q?: string;
  sort: SortKey;
  page: number;
  pageSize: number;
}

export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface EventServiceOptions {
  /** Сколько миллисекунд данные города считаются свежими. */
  cacheTtlMs: number;
  clock?: () => Date;
}

/** Сколько событий запрашиваем у источника за одно обновление кэша (максимум KudaGo — 100). */
const SYNC_PAGE_SIZE = 100;

/**
 * Сервис событий: отдаёт список из кэша (SQLite), а при устаревании обновляет его из источника.
 * Если источник упал, а в кэше есть данные, отдаёт устаревшие вместо ошибки.
 */
export class EventService {
  private readonly clock: () => Date;
  private readonly inflight = new Map<string, Promise<void>>();

  public constructor(
    private readonly source: EventSource,
    private readonly repository: IEventRepository,
    private readonly options: EventServiceOptions,
    private readonly logger: Logger,
  ) {
    this.clock = options.clock ?? (() => new Date());
  }

  public async list(query: EventListQuery): Promise<Page<Event>> {
    await this.ensureFresh(query.city);

    const filters = buildFilters(query, this.clock());
    const matched = this.repository
      .findByCity(query.city)
      .filter((event) => filters.every((filter) => filter.matches(event)))
      .sort((a, b) => getSortStrategy(query.sort).compare(a, b));

    const start = (query.page - 1) * query.pageSize;
    return {
      items: matched.slice(start, start + query.pageSize),
      page: query.page,
      pageSize: query.pageSize,
      total: matched.length,
      totalPages: Math.ceil(matched.length / query.pageSize),
    };
  }

  /** Событие берётся из кэша: сюда попадают события, которые уже были в списках. */
  public getById(id: string): Event {
    const event = this.repository.findById(id);
    if (event === null) throw new NotFoundError('Событие не найдено');
    return event;
  }

  private async ensureFresh(city: string): Promise<void> {
    const syncedAt = this.repository.getSyncedAt(city);
    if (
      syncedAt !== null &&
      this.clock().getTime() - syncedAt.getTime() < this.options.cacheTtlMs
    ) {
      return;
    }

    // Одновременные запросы к одному городу ждут одно и то же обновление
    let pending = this.inflight.get(city);
    if (pending === undefined) {
      pending = this.sync(city).finally(() => this.inflight.delete(city));
      this.inflight.set(city, pending);
    }
    await pending;
  }

  private async sync(city: string): Promise<void> {
    try {
      const events = await this.source.fetchEvents({ city, pageSize: SYNC_PAGE_SIZE });
      const now = this.clock();
      this.repository.saveMany(events, now);
      this.repository.markSynced(city, now);
      this.logger.info(`Кэш обновлён: город ${city}, событий ${events.length}`);
    } catch (error) {
      if (this.repository.findByCity(city).length === 0) throw error;
      this.logger.warn(`Не удалось обновить кэш города ${city}, отдаём устаревшие данные`, error);
    }
  }
}
