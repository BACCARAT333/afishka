import { ValidationError } from '../../shared/errors';
import { Concert } from './models/Concert';
import type { Event, EventCategory, EventProps } from './models/Event';
import { Exhibition } from './models/Exhibition';
import { Movie } from './models/Movie';
import { Performance } from './models/Performance';

/** Универсальное описание события «на входе» фабрики (например, из адаптера KudaGo). */
export interface EventDraft extends EventProps {
  category: string;
  genres?: string[];
  ageRestriction?: number | null;
  permanent?: boolean;
  durationMin?: number | null;
}

export class UnsupportedCategoryError extends ValidationError {
  public constructor(category: string) {
    super(`Неподдерживаемая категория события: ${category}`);
    this.name = 'UnsupportedCategoryError';
  }
}

const SUPPORTED: readonly EventCategory[] = ['concert', 'theater', 'exhibition', 'cinema'];

/** Фабрика (паттерн Factory): по категории создаёт нужный подкласс Event. */
export class EventFactory {
  public supports(category: string): category is EventCategory {
    return (SUPPORTED as readonly string[]).includes(category);
  }

  public create(draft: EventDraft): Event {
    const { category, genres, ageRestriction, permanent, durationMin, ...props } = draft;

    switch (category) {
      case 'concert':
        return new Concert(props, genres ?? []);
      case 'theater':
        return new Performance(props, ageRestriction ?? null);
      case 'exhibition':
        return new Exhibition(props, permanent ?? false);
      case 'cinema':
        return new Movie(props, durationMin ?? null);
      default:
        throw new UnsupportedCategoryError(category);
    }
  }
}
