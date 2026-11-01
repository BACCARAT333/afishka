import type { Event } from './models/Event';

/** Хранилище событий (кэш). Сервисы зависят от интерфейса, а не от конкретной БД. */
export interface IEventRepository {
  /** Сохраняет события; существующие с тем же id обновляются. */
  saveMany(events: Event[], cachedAt: Date): void;
  findById(id: string): Event | null;
  findByCity(city: string): Event[];
  /** Когда кэш города обновляли в последний раз (null — ни разу). */
  getSyncedAt(city: string): Date | null;
  markSynced(city: string, at: Date): void;
}
