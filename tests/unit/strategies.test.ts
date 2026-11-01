import { describe, expect, it } from 'vitest';
import { Concert } from '../../src/modules/events/models/Concert';
import { Exhibition } from '../../src/modules/events/models/Exhibition';
import { Movie } from '../../src/modules/events/models/Movie';
import {
  buildFilters,
  CategoryFilter,
  DateRangeFilter,
  FreeOnlyFilter,
  getSortStrategy,
  SortByDate,
  SortByTitle,
  TextSearchFilter,
} from '../../src/modules/events/strategies';
import { makeProps } from './helpers';

const NOW = new Date('2026-11-01T00:00:00Z');
const concert = new Concert(makeProps({ id: 'c', title: 'Рок-вечер' }));
const movie = new Movie(
  makeProps({
    id: 'm',
    title: 'Ночной сеанс',
    isFree: true,
    price: null,
    startsAt: new Date('2026-12-01T18:00:00Z'),
    endsAt: new Date('2026-12-01T20:00:00Z'),
  }),
);

describe('фильтры', () => {
  it('CategoryFilter', () => {
    expect(new CategoryFilter('concert').matches(concert)).toBe(true);
    expect(new CategoryFilter('concert').matches(movie)).toBe(false);
  });

  it('FreeOnlyFilter', () => {
    expect(new FreeOnlyFilter().matches(movie)).toBe(true);
    expect(new FreeOnlyFilter().matches(concert)).toBe(false);
  });

  it('DateRangeFilter: не закончилось к «от» и началось не позже «до»', () => {
    expect(new DateRangeFilter(NOW).matches(concert)).toBe(true);
    expect(new DateRangeFilter(new Date('2026-11-11T00:00:00Z')).matches(concert)).toBe(false);
    const to = new Date('2026-11-30T00:00:00Z');
    expect(new DateRangeFilter(NOW, to).matches(concert)).toBe(true);
    expect(new DateRangeFilter(NOW, to).matches(movie)).toBe(false);
  });

  it('TextSearchFilter: название, описание и место, без учёта регистра', () => {
    expect(new TextSearchFilter('РОК').matches(concert)).toBe(true);
    expect(new TextSearchFilter('описание').matches(concert)).toBe(true);
    expect(new TextSearchFilter('клуб «тест»').matches(concert)).toBe(true);
    expect(new TextSearchFilter('джаз').matches(concert)).toBe(false);
  });

  it('постоянная экспозиция всегда проходит фильтр дат', () => {
    const permanent = new Exhibition(makeProps({ id: 'p', endsAt: null }), true);
    expect(new DateRangeFilter(new Date('2030-01-01T00:00:00Z')).matches(permanent)).toBe(true);
  });
});

describe('buildFilters', () => {
  it('всегда добавляет фильтр дат, остальные только по параметрам', () => {
    expect(buildFilters({}, NOW)).toHaveLength(1);
    expect(buildFilters({ category: 'cinema', free: true, q: 'ночь' }, NOW)).toHaveLength(4);
  });

  it('free=false и пустой запрос фильтров не добавляют', () => {
    expect(buildFilters({ free: false, q: '' }, NOW)).toHaveLength(1);
  });
});

describe('сортировка', () => {
  it('по дате, затем по названию', () => {
    const sorted = [movie, concert].sort((a, b) => new SortByDate().compare(a, b));
    expect(sorted.map((e) => e.id)).toEqual(['c', 'm']);
  });

  it('по названию (русский алфавит)', () => {
    const sorted = [movie, concert].sort((a, b) => new SortByTitle().compare(a, b));
    expect(sorted.map((e) => e.id)).toEqual(['m', 'c']);
  });

  it('getSortStrategy выбирает нужную стратегию', () => {
    expect(getSortStrategy('title')).toBeInstanceOf(SortByTitle);
    expect(getSortStrategy('date')).toBeInstanceOf(SortByDate);
  });
});
