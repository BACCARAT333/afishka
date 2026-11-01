import { ValidationError } from '../../../shared/errors';
import type { Venue } from '../../venues/Venue';

export type EventCategory = 'concert' | 'theater' | 'exhibition' | 'cinema';

export type EventDto = Record<string, unknown>;

export interface EventProps {
  id: string;
  title: string;
  description: string;
  city: string;
  startsAt: Date;
  endsAt: Date | null;
  isFree: boolean;
  price: string | null;
  imageUrl: string | null;
  venue: Venue | null;
}

/**
 * Базовый (абстрактный) класс события.
 * Общие данные хранятся в приватном поле, наружу открыты только геттеры.
 * Наследники задают категорию, своё описание и дополнительные поля.
 */
export abstract class Event {
  private readonly props: Readonly<EventProps>;

  protected constructor(props: EventProps) {
    if (props.id.trim() === '') {
      throw new ValidationError('У события должен быть id');
    }
    if (props.title.trim() === '') {
      throw new ValidationError('У события должно быть название');
    }
    if (props.endsAt !== null && props.endsAt < props.startsAt) {
      throw new ValidationError('Окончание события не может быть раньше начала');
    }
    this.props = { ...props };
  }

  public abstract get category(): EventCategory;

  public abstract describe(): string;

  public get id(): string {
    return this.props.id;
  }

  public get title(): string {
    return this.props.title;
  }

  public get description(): string {
    return this.props.description;
  }

  public get city(): string {
    return this.props.city;
  }

  public get startsAt(): Date {
    return this.props.startsAt;
  }

  public get endsAt(): Date | null {
    return this.props.endsAt;
  }

  public get isFree(): boolean {
    return this.props.isFree;
  }

  public get price(): string | null {
    return this.props.price;
  }

  public get imageUrl(): string | null {
    return this.props.imageUrl;
  }

  public get venue(): Venue | null {
    return this.props.venue;
  }

  /** Событие ещё не закончилось на указанный момент. */
  public isActiveAt(moment: Date): boolean {
    const end = this.props.endsAt ?? this.props.startsAt;
    return end >= moment;
  }

  public toJSON(): EventDto {
    return {
      id: this.props.id,
      title: this.props.title,
      description: this.props.description,
      city: this.props.city,
      category: this.category,
      startsAt: this.props.startsAt.toISOString(),
      endsAt: this.props.endsAt?.toISOString() ?? null,
      isFree: this.props.isFree,
      price: this.props.price,
      imageUrl: this.props.imageUrl,
      venue: this.props.venue?.toJSON() ?? null,
      ...this.extraFields(),
    };
  }

  /** Общая часть текста описания: «Название», город, дата. */
  protected get baseInfo(): string {
    const date = this.props.startsAt.toISOString().slice(0, 10);
    return `«${this.props.title}», ${this.props.city}, ${date}`;
  }

  /** Дополнительные поля наследников для toJSON(). */
  protected extraFields(): Record<string, unknown> {
    return {};
  }
}
