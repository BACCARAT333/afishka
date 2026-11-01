import { ValidationError } from '../../shared/errors';

export interface UserProps {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

/** Пользователь. Хэш пароля доступен только через геттер и никогда не попадает в toJSON(). */
export class User {
  private readonly props: Readonly<UserProps>;

  public constructor(props: UserProps) {
    if (props.id.trim() === '') throw new ValidationError('У пользователя должен быть id');
    if (props.email.trim() === '') throw new ValidationError('У пользователя должен быть email');
    this.props = { ...props };
  }

  public get id(): string {
    return this.props.id;
  }

  public get email(): string {
    return this.props.email;
  }

  public get passwordHash(): string {
    return this.props.passwordHash;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public toJSON(): { id: string; email: string; createdAt: string } {
    return {
      id: this.props.id,
      email: this.props.email,
      createdAt: this.props.createdAt.toISOString(),
    };
  }
}
