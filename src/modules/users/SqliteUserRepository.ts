import { ConflictError } from '../../shared/errors';
import type { Db } from '../../shared/db';
import type { IUserRepository } from './IUserRepository';
import { User } from './User';

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
}

const EMAIL_TAKEN = 'Пользователь с таким email уже зарегистрирован';

export class SqliteUserRepository implements IUserRepository {
  public constructor(private readonly db: Db) {}

  public add(user: User): void {
    try {
      this.db
        .prepare('INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)')
        .run(user.id, user.email, user.passwordHash, user.createdAt.toISOString());
    } catch (error) {
      const code = error instanceof Error ? (error as { code?: unknown }).code : undefined;
      if (typeof code === 'string' && code.startsWith('SQLITE_CONSTRAINT')) {
        throw new ConflictError(EMAIL_TAKEN);
      }
      throw error;
    }
  }

  public findByEmail(email: string): User | null {
    const row = this.db.prepare('SELECT * FROM users WHERE email = ?').get(email) as
      UserRow | undefined;
    return row === undefined ? null : this.toUser(row);
  }

  public findById(id: string): User | null {
    const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
    return row === undefined ? null : this.toUser(row);
  }

  private toUser(row: UserRow): User {
    return new User({
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      createdAt: new Date(row.created_at),
    });
  }
}
