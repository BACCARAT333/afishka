import { Event, type EventCategory, type EventProps } from './Event';

export class Exhibition extends Event {
  private readonly _permanent: boolean;

  public constructor(props: EventProps, permanent = false) {
    super(props);
    this._permanent = permanent;
  }

  public override get category(): EventCategory {
    return 'exhibition';
  }

  public get permanent(): boolean {
    return this._permanent;
  }

  public override describe(): string {
    const kind = this._permanent ? 'Постоянная экспозиция' : 'Выставка';
    return `${kind} ${this.baseInfo}`;
  }

  protected override extraFields(): Record<string, unknown> {
    return { permanent: this._permanent };
  }
}
