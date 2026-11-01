import { describe, expect, it, vi } from 'vitest';
import { KudaGoClient } from '../../src/integrations/kudago/KudaGoClient';
import { IntegrationError } from '../../src/shared/errors';

const BASE = 'https://kudago.example/public-api/v1.4/';
const body = { count: 1, next: null, previous: null, results: [{ id: 1, title: 'Тест' }] };

function makeClient(fetchFn: typeof fetch): KudaGoClient {
  return new KudaGoClient({ baseUrl: BASE, timeoutMs: 1000, fetchFn });
}

describe('KudaGoClient', () => {
  it('формирует URL с фильтрами и возвращает JSON', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(body)));
    const result = await makeClient(fetchFn).getEvents({
      location: 'spb',
      categories: 'concert',
      isFree: true,
      page: 2,
      pageSize: 10,
    });

    expect(result.count).toBe(1);
    const url = new URL(String(fetchFn.mock.calls[0]?.[0]));
    expect(url.origin + url.pathname).toBe('https://kudago.example/public-api/v1.4/events/');
    expect(url.searchParams.get('location')).toBe('spb');
    expect(url.searchParams.get('categories')).toBe('concert');
    expect(url.searchParams.get('is_free')).toBe('true');
    expect(url.searchParams.get('page_size')).toBe('10');
    expect(url.searchParams.get('text_format')).toBe('text');
  });

  it('статус не 2xx превращается в IntegrationError', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(new Response('oops', { status: 500 }));
    await expect(makeClient(fetchFn).getEvents({ location: 'spb' })).rejects.toThrow(
      IntegrationError,
    );
  });

  it('сетевая ошибка даёт 502, тайм-аут даёт 504', async () => {
    const network = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('fetch failed'));
    await expect(makeClient(network).getEvents({ location: 'spb' })).rejects.toMatchObject({
      status: 502,
    });

    const timeout = new Error('timeout');
    timeout.name = 'TimeoutError';
    const slow = vi.fn<typeof fetch>().mockRejectedValue(timeout);
    await expect(makeClient(slow).getEvents({ location: 'spb' })).rejects.toMatchObject({
      status: 504,
    });
  });

  it('ответ не в формате JSON даёт IntegrationError', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(new Response('<html>'));
    await expect(makeClient(fetchFn).getEvents({ location: 'spb' })).rejects.toThrow(
      IntegrationError,
    );
  });
});
