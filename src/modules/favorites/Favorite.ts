/** Запись «пользователь добавил событие в избранное». */
export class Favorite {
  public constructor(
    private readonly _userId: string,
    private readonly _eventId: string,
    private readonly _createdAt: Date,
  ) {}

  public get userId(): string {
    return this._userId;
  }

  public get eventId(): string {
    return this._eventId;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }
}
