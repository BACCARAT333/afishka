import { Event, type EventCategory, type EventProps } from './Event';

export class Movie extends Event {
  private readonly _durationMin: number | null;

  public constructor(props: EventProps, durationMin: number | null = null) {
    super(props);
    this._durationMin = durationMin;
  }

  public override get category(): EventCategory {
    return 'cinema';
  }

  public get durationMin(): number | null {
    return this._durationMin;
  }

  public override describe(): string {
    const duration = this._durationMin !== null ? `, ${this._durationMin} мин` : '';
    return `Фильм ${this.baseInfo}${duration}`;
  }

  protected override extraFields(): Record<string, unknown> {
    return { durationMin: this._durationMin };
  }
}
