import { IntegrationError } from '../../shared/errors';
import type { KudaGoEventRaw, KudaGoEventsQuery, KudaGoListResponse } from './types';

export interface KudaGoClientOptions {
  baseUrl: string;
  timeoutMs: number;
  fetchFn?: typeof fetch;
}

const EVENT_FIELDS =
  'id,title,description,dates,place,images,price,is_free,categories,tags,age_restriction';

/** HTTP-клиент KudaGo API: запросы, тайм-аут, превращение сбоев в IntegrationError. */
export class KudaGoClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchFn: typeof fetch;

  public constructor(options: KudaGoClientOptions) {
    this.baseUrl = options.baseUrl.endsWith('/') ? options.baseUrl : `${options.baseUrl}/`;
    this.timeoutMs = options.timeoutMs;
    this.fetchFn = options.fetchFn ?? ((input, init) => fetch(input, init));
  }

  public async getEvents(query: KudaGoEventsQuery): Promise<KudaGoListResponse<KudaGoEventRaw>> {
    const url = new URL('events/', this.baseUrl);
    const params = url.searchParams;
    params.set('lang', 'ru');
    params.set('text_format', 'text');
    params.set('fields', EVENT_FIELDS);
    params.set('expand', 'place,images');
    params.set('order_by', 'dates');
    params.set('location', query.location);
    if (query.categories !== undefined) params.set('categories', query.categories);
    if (query.actualSince !== undefined) params.set('actual_since', String(query.actualSince));
    if (query.actualUntil !== undefined) params.set('actual_until', String(query.actualUntil));
    if (query.isFree !== undefined) params.set('is_free', String(query.isFree));
    if (query.page !== undefined) params.set('page', String(query.page));
    if (query.pageSize !== undefined) params.set('page_size', String(query.pageSize));
    return this.getJson<KudaGoListResponse<KudaGoEventRaw>>(url);
  }

  private async getJson<T>(url: URL): Promise<T> {
    let response: Response;
    try {
      response = await this.fetchFn(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      const timedOut =
        error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');
      throw timedOut
        ? new IntegrationError('Превышено время ожидания ответа KudaGo API', 504)
        : new IntegrationError('KudaGo API недоступен');
    }

    if (!response.ok) {
      throw new IntegrationError(`KudaGo API вернул статус ${response.status}`);
    }

    try {
      return (await response.json()) as T;
    } catch {
      throw new IntegrationError('KudaGo API вернул ответ не в формате JSON');
    }
  }
}
