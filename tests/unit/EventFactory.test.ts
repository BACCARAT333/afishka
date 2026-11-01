import { describe, expect, it } from 'vitest';
import { EventFactory, UnsupportedCategoryError } from '../../src/modules/events/EventFactory';
import { Concert } from '../../src/modules/events/models/Concert';
import { Exhibition } from '../../src/modules/events/models/Exhibition';
import { Movie } from '../../src/modules/events/models/Movie';
import { Performance } from '../../src/modules/events/models/Performance';
import { makeProps } from './helpers';

describe('EventFactory', () => {
  const factory = new EventFactory();

  it.each([
    ['concert', Concert],
    ['theater', Performance],
    ['exhibition', Exhibition],
    ['cinema', Movie],
  ])('категория %s даёт нужный класс', (category, expectedClass) => {
    const event = factory.create({ ...makeProps(), category });
    expect(event).toBeInstanceOf(expectedClass);
  });

  it('передаёт дополнительные поля в наследников', () => {
    const concert = factory.create({ ...makeProps(), category: 'concert', genres: ['рок'] });
    expect(concert.toJSON()).toMatchObject({ genres: ['рок'] });

    const movie = factory.create({ ...makeProps(), category: 'cinema', durationMin: 95 });
    expect(movie.toJSON()).toMatchObject({ durationMin: 95 });
  });

  it('неизвестная категория: UnsupportedCategoryError', () => {
    expect(() => factory.create({ ...makeProps(), category: 'party' })).toThrow(
      UnsupportedCategoryError,
    );
  });

  it('supports() отличает известные категории от неизвестных', () => {
    expect(factory.supports('concert')).toBe(true);
    expect(factory.supports('party')).toBe(false);
  });
});
