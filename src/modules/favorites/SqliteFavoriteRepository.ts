import type { Db } from '../../shared/db';
import { Favorite } from './Favorite';
import type { IFavoriteRepository } from './IFavoriteRepository';

interface FavoriteRow {
  user_id: string;
  event_id: string;
  created_at: string;
}

export class SqliteFavoriteRepository implements IFavoriteRepository {
  public constructor(private readonly db: Db) {}

  public add(favorite: Favorite): boolean {
    const result = this.db
      .prepare('INSERT OR IGNORE INTO favorites (user_id, event_id, created_at) VALUES (?, ?, ?)')
      .run(favorite.userId, favorite.eventId, favorite.createdAt.toISOString());
    return Number(result.changes) > 0;
  }

  public remove(userId: string, eventId: string): boolean {
    const result = this.db
      .prepare('DELETE FROM favorites WHERE user_id = ? AND event_id = ?')
      .run(userId, eventId);
    return Number(result.changes) > 0;
  }

  public listByUser(userId: string): Favorite[] {
    const rows = this.db
      .prepare('SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at DESC, rowid DESC')
      .all(userId) as FavoriteRow[];
    return rows.map((row) => new Favorite(row.user_id, row.event_id, new Date(row.created_at)));
  }
}
