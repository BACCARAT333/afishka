import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app';
import { createTestApp } from './testApp';

const webDir = mkdtempSync(join(tmpdir(), 'afishka-web-'));
writeFileSync(join(webDir, 'index.html'), '<!doctype html><title>Афишка</title>');
const { container } = createTestApp();

afterAll(() => {
  container.close();
  rmSync(webDir, { recursive: true, force: true });
});

describe('раздача фронтенда', () => {
  const app = createApp({ ...container, staticDir: webDir });

  it('отдаёт index.html на корневой адрес', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('Афишка');
  });

  it('API работает рядом со статикой', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', service: 'afishka' });
  });

  it('неизвестный путь отдаёт 404 в едином формате', async () => {
    const res = await request(app).get('/no-such-page');
    expect(res.status).toBe(404);
    expect(res.body.error.status).toBe(404);
  });

  it('не выдаёт заголовок X-Powered-By', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

describe('без сборки фронтенда', () => {
  it('корневой адрес даёт 404, если папки со сборкой нет', async () => {
    const app = createApp({ ...container, staticDir: join(webDir, 'missing') });
    const res = await request(app).get('/');
    expect(res.status).toBe(404);
  });
});
