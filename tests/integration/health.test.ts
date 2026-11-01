import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app';

describe('GET /api/health', () => {
  it('возвращает статус ok', async () => {
    const res = await request(createApp()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', service: 'afishka' });
  });

  it('неизвестный маршрут отдаёт 404 в едином формате', async () => {
    const res = await request(createApp()).get('/api/unknown');
    expect(res.status).toBe(404);
    expect(res.body.error.status).toBe(404);
  });
});
