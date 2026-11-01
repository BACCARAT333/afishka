import type { Request, Response } from 'express';
import type { FavoriteService } from './FavoriteService';

/** Все методы работают после проверки токена: id пользователя лежит в res.locals.userId. */
export class FavoriteController {
  public constructor(private readonly service: FavoriteService) {}

  public list(_req: Request, res: Response): void {
    const events = this.service.list(this.userId(res));
    res.json({ items: events.map((event) => event.toJSON()) });
  }

  public add(req: Request, res: Response): void {
    const eventId = String(req.params.eventId);
    const added = this.service.add(this.userId(res), eventId);
    res.status(added ? 201 : 200).json({ eventId });
  }

  public remove(req: Request, res: Response): void {
    this.service.remove(this.userId(res), String(req.params.eventId));
    res.status(204).end();
  }

  private userId(res: Response): string {
    return String(res.locals.userId);
  }
}
