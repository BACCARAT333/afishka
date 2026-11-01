import { randomUUID } from 'node:crypto';
import { ConflictError, UnauthorizedError } from '../../shared/errors';
import type { Credentials } from './credentials';
import type { IUserRepository } from './IUserRepository';
import type { PasswordHasher } from './PasswordHasher';
import type { TokenService } from './TokenService';
import { User } from './User';

export interface AuthResult {
  user: User;
  token: string;
}

const BAD_CREDENTIALS = 'Неверный email или пароль';

export class AuthService {
  private dummyHash: Promise<string> | null = null;

  public constructor(
    private readonly users: IUserRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService,
    private readonly newId: () => string = randomUUID,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  public async register(credentials: Credentials): Promise<AuthResult> {
    if (this.users.findByEmail(credentials.email) !== null) {
      throw new ConflictError('Пользователь с таким email уже зарегистрирован');
    }
    const user = new User({
      id: this.newId(),
      email: credentials.email,
      passwordHash: await this.hasher.hash(credentials.password),
      createdAt: this.clock(),
    });
    this.users.add(user);
    return { user, token: this.tokens.sign(user) };
  }

  public async login(credentials: Credentials): Promise<AuthResult> {
    const user = this.users.findByEmail(credentials.email);
    if (user === null) {
      // Сравниваем с «пустышкой», чтобы ответ не выдавал, есть ли такой email
      await this.hasher.verify(credentials.password, await this.getDummyHash());
      throw new UnauthorizedError(BAD_CREDENTIALS);
    }
    if (!(await this.hasher.verify(credentials.password, user.passwordHash))) {
      throw new UnauthorizedError(BAD_CREDENTIALS);
    }
    return { user, token: this.tokens.sign(user) };
  }

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= this.hasher.hash('dummy-password-for-timing');
    return this.dummyHash;
  }
}
