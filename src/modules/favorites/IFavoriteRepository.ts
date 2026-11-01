import type { Favorite } from './Favorite';

export interface IFavoriteRepository {
  /** true, если запись добавлена; false, если событие уже было в избранном. */
  add(favorite: Favorite): boolean;
  /** true, если запись удалена; false, если её не было. */
  remove(userId: string, eventId: string): boolean;
  /** Избранное пользователя: сначала добавленные позже. */
  listByUser(userId: string): Favorite[];
}
