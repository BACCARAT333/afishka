import type { Request, Response } from 'express';
import { parseEventListQuery } from './parseEventQuery';
import type { EventService } from './EventService';

/** Контроллер: разбирает HTTP-запрос, вызывает сервис, формирует ответ. Логики предметной области тут нет. */
export class EventController {
  public constructor(
    private readonly service: EventService,
    private readonly defaultCity: string,
  ) {}

  public async list(req: Request, res: Response): Promise<void> {
    const query = parseEventListQuery(req.query as Record<string, unknown>, this.defaultCity);
    const page = await this.service.list(query);
    res.json({
      items: page.items.map((event) => event.toJSON()),
      page: page.page,
      pageSize: page.pageSize,
      total: page.total,
      totalPages: page.totalPages,
    });
  }

  public get(req: Request, res: Response): void {
    const event = this.service.getById(String(req.params.id));
    res.json(event.toJSON());
  }
}
