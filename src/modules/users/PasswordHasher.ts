import bcrypt from 'bcryptjs';

/** Хэширование паролей. Сервис зависит от интерфейса, а не от bcrypt. */
export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  verify(plain: string, hash: string): Promise<boolean>;
}

export class BcryptPasswordHasher implements PasswordHasher {
  public constructor(private readonly rounds: number) {}

  public hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.rounds);
  }

  public verify(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
