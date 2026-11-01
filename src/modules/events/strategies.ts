import type { Event, EventCategory } from './models/Event';

/** Стратегия фильтрации (паттерн Strategy): одно правило — «подходит ли событие». */
export interface FilterStrategy {
  matches(event: Event): boolean;
}

/** Стратегия сортировки: правило сравнения двух событий. */
export interface SortStrategy {
  compare(a: Event, b: Event): number;
}

export type SortKey = 'date' | 'title';

export class CategoryFilter implements FilterStrategy {
  public constructor(private readonly category: EventCategory) {}

  public matches(event: Event): boolean {
    return event.category === this.category;
  }
}

export class FreeOnlyFilter implements FilterStrategy {
  public matches(event: Event): boolean {
    return event.isFree;
  }
}

/** События, которые не закончились к `from` и начинаются не позже `to` (если он задан). */
export class DateRangeFilter implements FilterStrategy {
  public constructor(
    private readonly from: Date,
    private readonly to: Date | null = null,
  ) {}

  public matches(event: Event): boolean {
    return event.isActiveAt(this.from) && (this.to === null || event.startsAt <= this.to);
  }
}

/** Поиск подстроки (без учёта регистра) в названии, описании и названии места. */
export class TextSearchFilter implements FilterStrategy {
  private readonly needle: string;

  public constructor(query: string) {
    this.needle = query.trim().toLocaleLowerCase('ru');
  }

  public matches(event: Event): boolean {
    const haystack = `${event.title}\n${event.description}\n${event.venue?.name ?? ''}`;
    return haystack.toLocaleLowerCase('ru').includes(this.needle);
  }
}

export class SortByDate implements SortStrategy {
  public compare(a: Event, b: Event): number {
    return a.startsAt.getTime() - b.startsAt.getTime() || a.title.localeCompare(b.title, 'ru');
  }
}

export class SortByTitle implements SortStrategy {
  public compare(a: Event, b: Event): number {
    return a.title.localeCompare(b.title, 'ru') || a.startsAt.getTime() - b.startsAt.getTime();
  }
}

export function getSortStrategy(key: SortKey): SortStrategy {
  return key === 'title' ? new SortByTitle() : new SortByDate();
}

export interface FilterCriteria {
  category?: EventCategory;
  dateFrom?: Date;
  dateTo?: Date;
  free?: boolean;
  q?: string;
}

/** Собирает набор стратегий по параметрам запроса. Даты «от» по умолчанию — текущий момент. */
export function buildFilters(criteria: FilterCriteria, now: Date): FilterStrategy[] {
  const filters: FilterStrategy[] = [
    new DateRangeFilter(criteria.dateFrom ?? now, criteria.dateTo ?? null),
  ];
  if (criteria.category !== undefined) filters.push(new CategoryFilter(criteria.category));
  if (criteria.free === true) filters.push(new FreeOnlyFilter());
  if (criteria.q !== undefined && criteria.q !== '') filters.push(new TextSearchFilter(criteria.q));
  return filters;
}
