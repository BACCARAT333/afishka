import { Event, type EventCategory, type EventProps } from './Event';

/** Театральный спектакль. */
export class Performance extends Event {
  private readonly _ageRestriction: number | null;

  public constructor(props: EventProps, ageRestriction: number | null = null) {
    super(props);
    this._ageRestriction = ageRestriction;
  }

  public override get category(): EventCategory {
    return 'theater';
  }

  public get ageRestriction(): number | null {
    return this._ageRestriction;
  }

  public override describe(): string {
    const age = this._ageRestriction !== null ? `, ${this._ageRestriction}+` : '';
    return `Спектакль ${this.baseInfo}${age}`;
  }

  protected override extraFields(): Record<string, unknown> {
    return { ageRestriction: this._ageRestriction };
  }
}
