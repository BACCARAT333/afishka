import { describe, expect, it, vi } from 'vitest';
import { FallbackEventSource } from '../../src/integrations/kudago/FallbackEventSource';
import { FixtureEventSource } from '../../src/integrations/kudago/FixtureEventSource';
import { KudaGoAdapter } from '../../src/integrations/kudago/KudaGoAdapter';
import { EventFactory } from '../../src/modules/events/EventFactory';
import type { EventSource } from '../../src/modules/events/EventSource';
import { IntegrationError } from '../../src/shared/errors';

const NOW = new Date('2026-11-01T00:00:00Z');
const adapter = new KudaGoAdapter(new EventFactory());
const fixtures = new FixtureEventSource(adapter, undefined, () => NOW);

describe('FixtureEventSource', () => {
  it('отдаёт только поддерживаемые события нужного города', async () => {
    const events = await fixtures.fetchEvents({ city: 'spb' });
    expect(events.map((e) => e.id).sort()).toEqual(['1', '2', '3', '4', '5']);
    expect(events.every((e) => e.city === 'spb')).toBe(true);
  });

  it('фильтрует по категории и бесплатности', async () => {
    const concerts = await fixtures.fetchEvents({ city: 'spb', category: 'concert' });
    expect(concerts.map((e) => e.id)).toEqual(['1']);

    const free = await fixtures.fetchEvents({ city: 'spb', free: true });
    expect(free.map((e) => e.id)).toEqual(['3']);
  });

  it('фильтрует по дате окончания выборки', async () => {
    const early = await fixtures.fetchEvents({
      city: 'spb',
      dateTo: new Date('2027-02-15T00:00:00Z'),
    });
    expect(early.map((e) => e.id).sort()).toEqual(['3', '4']);
  });

  it('поддерживает пагинацию', async () => {
    const page1 = await fixtures.fetchEvents({ city: 'spb', page: 1, pageSize: 3 });
    const page2 = await fixtures.fetchEvents({ city: 'spb', page: 2, pageSize: 3 });
    expect(page1).toHaveLength(3);
    expect(page2).toHaveLength(2);
  });

  it('для города без данных возвращает пустой список', async () => {
    expect(await fixtures.fetchEvents({ city: 'ekb' })).toEqual([]);
  });
});

describe('FallbackEventSource', () => {
  it('при ошибке основного источника берёт запасной и сообщает об этом', async () => {
    const primary: EventSource = {
      fetchEvents: vi.fn().mockRejectedValue(new IntegrationError('KudaGo API недоступен')),
    };
    const onFallback = vi.fn();
    const source = new FallbackEventSource(primary, fixtures, onFallback);

    const events = await source.fetchEvents({ city: 'spb' });
    expect(events).toHaveLength(5);
    expect(onFallback).toHaveBeenCalledOnce();
  });

  it('если основной источник работает, запасной не трогает', async () => {
    const primary: EventSource = { fetchEvents: vi.fn().mockResolvedValue([]) };
    const fallback: EventSource = { fetchEvents: vi.fn() };
    const source = new FallbackEventSource(primary, fallback);

    expect(await source.fetchEvents({ city: 'spb' })).toEqual([]);
    expect(fallback.fetchEvents).not.toHaveBeenCalled();
  });
});
