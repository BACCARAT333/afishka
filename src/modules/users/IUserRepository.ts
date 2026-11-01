import type { User } from './User';

export interface IUserRepository {
  /** Сохраняет нового пользователя; при занятом email бросает ConflictError. */
  add(user: User): void;
  findByEmail(email: string): User | null;
  findById(id: string): User | null;
}
