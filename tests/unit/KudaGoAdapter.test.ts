import { describe, expect, it } from 'vitest';
import { KudaGoAdapter } from '../../src/integrations/kudago/KudaGoAdapter';
import type { KudaGoEventRaw } from '../../src/integrations/kudago/types';
import { EventFactory } from '../../src/modules/events/EventFactory';
import { Concert } from '../../src/modules/events/models/Concert';
import { Exhibition } from '../../src/modules/events/models/Exhibition';
import { Performance } from '../../src/modules/events/models/Performance';

const NOW = new Date('2026-11-01T00:00:00Z');
const sec = (iso: string): number => Date.parse(iso) / 1000;

function raw(overrides: Partial<KudaGoEventRaw> = {}): KudaGoEventRaw {
  return {
    id: 10,
    title: 'Концерт',
    description: 'Описание',
    dates: [{ start: sec('2026-12-01T18:00:00Z'), end: sec('2026-12-01T20:00:00Z') }],
    place: {
      id: 5,
      title: 'Клуб',
      address: 'ул. Тестовая, 1',
      location: 'spb',
      coords: { lat: 59.9, lon: 30.3 },
    },
    images: [{ image: 'https://example.com/a.jpg' }],
    price: 'от 500 руб.',
    is_free: false,
    categories: ['concert'],
    tags: ['рок'],
    age_restriction: '16+',
    ...overrides,
  };
}

describe('KudaGoAdapter', () => {
  const adapter = new KudaGoAdapter(new EventFactory());

  it('преобразует концерт: поля, жанры, место, цена, картинка', () => {
    const event = adapter.toEvent(raw(), 'spb', NOW);
    expect(event).toBeInstanceOf(Concert);
    expect(event?.toJSON()).toMatchObject({
      id: '10',
      city: 'spb',
      price: 'от 500 руб.',
      isFree: false,
      imageUrl: 'https://example.com/a.jpg',
      genres: ['рок'],
      startsAt: '2026-12-01T18:00:00.000Z',
      venue: { id: '5', name: 'Клуб', latitude: 59.9, longitude: 30.3 },
    });
  });

  it('постоянная экспозиция: «бессрочные» даты отбрасываются', () => {
    const event = adapter.toEvent(
      raw({
        categories: ['permanent-exhibitions'],
        dates: [{ start: -62135433000, end: 253370754000 }],
      }),
      'spb',
      NOW,
    );
    expect(event).toBeInstanceOf(Exhibition);
    expect((event as Exhibition).permanent).toBe(true);
    expect(event?.startsAt).toEqual(NOW);
    expect(event?.endsAt).toBeNull();
  });

  it('театр: возрастное ограничение "12+" превращается в число', () => {
    const event = adapter.toEvent(
      raw({ categories: ['theater'], age_restriction: '12+' }),
      'spb',
      NOW,
    );
    expect(event).toBeInstanceOf(Performance);
    expect((event as Performance).ageRestriction).toBe(12);
  });

  it('выбирает ближайший не закончившийся сеанс', () => {
    const event = adapter.toEvent(
      raw({
        dates: [
          { start: sec('2026-10-01T18:00:00Z'), end: sec('2026-10-01T20:00:00Z') },
          { start: sec('2026-11-15T18:00:00Z'), end: sec('2026-11-15T20:00:00Z') },
        ],
      }),
      'spb',
      NOW,
    );
    expect(event?.startsAt.toISOString()).toBe('2026-11-15T18:00:00.000Z');
  });

  it('неподдерживаемая категория и невалидные данные дают null', () => {
    expect(adapter.toEvent(raw({ categories: ['party'] }), 'spb', NOW)).toBeNull();
    expect(adapter.toEvent(raw({ title: '' }), 'spb', NOW)).toBeNull();
  });

  it('без места и картинок поля остаются пустыми', () => {
    const event = adapter.toEvent(raw({ place: null, images: [], price: '' }), 'spb', NOW);
    expect(event?.venue).toBeNull();
    expect(event?.imageUrl).toBeNull();
    expect(event?.price).toBeNull();
  });

  it('toEvents пропускает неподходящие события', () => {
    const events = adapter.toEvents(
      [raw({ id: 1 }), raw({ id: 2, categories: ['party'] }), raw({ id: 3 })],
      'spb',
      NOW,
    );
    expect(events.map((e) => e.id)).toEqual(['1', '3']);
  });
});
