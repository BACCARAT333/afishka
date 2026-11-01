export interface VenueProps {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
}

/** Место проведения события (театр, клуб, музей и т.п.). */
export class Venue {
  private readonly props: Readonly<VenueProps>;

  public constructor(props: VenueProps) {
    this.props = { ...props };
  }

  public get id(): string {
    return this.props.id;
  }

  public get name(): string {
    return this.props.name;
  }

  public get address(): string {
    return this.props.address;
  }

  public get city(): string {
    return this.props.city;
  }

  public get latitude(): number | null {
    return this.props.latitude;
  }

  public get longitude(): number | null {
    return this.props.longitude;
  }

  public get fullAddress(): string {
    return `${this.props.city}, ${this.props.address}`;
  }

  public toJSON(): VenueProps {
    return { ...this.props };
  }
}
