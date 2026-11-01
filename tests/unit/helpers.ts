import type { EventProps } from '../../src/modules/events/models/Event';
import { Venue } from '../../src/modules/venues/Venue';

export function makeVenue(): Venue {
  return new Venue({
    id: 'v1',
    name: 'Клуб «Тест»',
    address: 'Невский пр., 1',
    city: 'spb',
    latitude: 59.93,
    longitude: 30.33,
  });
}

export function makeProps(overrides: Partial<EventProps> = {}): EventProps {
  return {
    id: '1',
    title: 'Тестовое событие',
    description: 'Описание',
    city: 'spb',
    startsAt: new Date('2026-11-10T19:00:00Z'),
    endsAt: new Date('2026-11-10T21:00:00Z'),
    isFree: false,
    price: 'от 500 руб.',
    imageUrl: null,
    venue: makeVenue(),
    ...overrides,
  };
}
