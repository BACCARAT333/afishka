import { Event, type EventCategory, type EventProps } from './Event';

export class Concert extends Event {
  private readonly _genres: string[];

  public constructor(props: EventProps, genres: string[] = []) {
    super(props);
    this._genres = [...genres];
  }

  public override get category(): EventCategory {
    return 'concert';
  }

  public get genres(): readonly string[] {
    return this._genres;
  }

  public override describe(): string {
    const genres = this._genres.length > 0 ? `, жанры: ${this._genres.join(', ')}` : '';
    return `Концерт ${this.baseInfo}${genres}`;
  }

  protected override extraFields(): Record<string, unknown> {
    return { genres: [...this._genres] };
  }
}
