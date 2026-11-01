import { describe, expect, it } from 'vitest';
import { Concert } from '../../src/modules/events/models/Concert';
import { Exhibition } from '../../src/modules/events/models/Exhibition';
import { Movie } from '../../src/modules/events/models/Movie';
import { Performance } from '../../src/modules/events/models/Performance';
import { ValidationError } from '../../src/shared/errors';
import { makeProps } from './helpers';

describe('Event и наследники', () => {
  it('Concert: категория, описание и жанры', () => {
    const concert = new Concert(makeProps(), ['рок', 'метал']);
    expect(concert.category).toBe('concert');
    expect(concert.describe()).toBe(
      'Концерт «Тестовое событие», spb, 2026-11-10, жанры: рок, метал',
    );
  });

  it('Performance: возрастное ограничение в описании', () => {
    const play = new Performance(makeProps(), 12);
    expect(play.category).toBe('theater');
    expect(play.describe()).toContain('12+');
  });

  it('Exhibition: постоянная экспозиция отличается от выставки', () => {
    expect(new Exhibition(makeProps(), true).describe()).toContain('Постоянная экспозиция');
    expect(new Exhibition(makeProps()).describe()).toMatch(/^Выставка/);
  });

  it('Movie: длительность попадает в toJSON', () => {
    const movie = new Movie(makeProps(), 120);
    expect(movie.category).toBe('cinema');
    expect(movie.toJSON()).toMatchObject({ category: 'cinema', durationMin: 120 });
  });

  it('toJSON: даты в ISO, место вложено', () => {
    const json = new Concert(makeProps(), ['джаз']).toJSON();
    expect(json.startsAt).toBe('2026-11-10T19:00:00.000Z');
    expect(json.genres).toEqual(['джаз']);
    expect(json.venue).toMatchObject({ id: 'v1', name: 'Клуб «Тест»' });
  });

  it('isActiveAt: до окончания активно, после — нет', () => {
    const concert = new Concert(makeProps());
    expect(concert.isActiveAt(new Date('2026-11-10T20:00:00Z'))).toBe(true);
    expect(concert.isActiveAt(new Date('2026-11-11T00:00:00Z'))).toBe(false);
  });

  it('isActiveAt: без даты окончания ориентируется на начало', () => {
    const concert = new Concert(makeProps({ endsAt: null }));
    expect(concert.isActiveAt(new Date('2026-11-10T18:00:00Z'))).toBe(true);
    expect(concert.isActiveAt(new Date('2026-11-10T20:00:00Z'))).toBe(false);
  });

  it('валидация: окончание раньше начала', () => {
    const props = makeProps({ endsAt: new Date('2026-11-10T10:00:00Z') });
    expect(() => new Concert(props)).toThrow(ValidationError);
  });

  it('валидация: пустое название и пустой id', () => {
    expect(() => new Concert(makeProps({ title: '  ' }))).toThrow(ValidationError);
    expect(() => new Concert(makeProps({ id: '' }))).toThrow(ValidationError);
  });
});
