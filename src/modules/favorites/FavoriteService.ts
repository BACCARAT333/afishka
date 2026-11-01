import { NotFoundError } from '../../shared/errors';
import type { IEventRepository } from '../events/IEventRepository';
import type { Event } from '../events/models/Event';
import { Favorite } from './Favorite';
import type { IFavoriteRepository } from './IFavoriteRepository';

export class FavoriteService {
  public constructor(
    private readonly favorites: IFavoriteRepository,
    private readonly events: IEventRepository,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  /** События из избранного; те, что уже пропали из кэша, пропускаются. */
  public list(userId: string): Event[] {
    const events: Event[] = [];
    for (const favorite of this.favorites.listByUser(userId)) {
      const event = this.events.findById(favorite.eventId);
      if (event !== null) events.push(event);
    }
    return events;
  }

  /** Возвращает true, если событие добавлено сейчас, и false, если оно уже было в избранном. */
  public add(userId: string, eventId: string): boolean {
    if (this.events.findById(eventId) === null) throw new NotFoundError('Событие не найдено');
    return this.favorites.add(new Favorite(userId, eventId, this.clock()));
  }

  public remove(userId: string, eventId: string): void {
    if (!this.favorites.remove(userId, eventId)) {
      throw new NotFoundError('События нет в избранном');
    }
  }
}
