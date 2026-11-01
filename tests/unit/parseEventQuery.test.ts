import { describe, expect, it } from 'vitest';
import { parseEventListQuery } from '../../src/modules/events/parseEventQuery';
import { ValidationError } from '../../src/shared/errors';

describe('parseEventListQuery', () => {
  it('значения по умолчанию', () => {
    expect(parseEventListQuery({}, 'spb')).toEqual({
      city: 'spb',
      category: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      free: undefined,
      q: undefined,
      sort: 'date',
      page: 1,
      pageSize: 20,
    });
  });

  it('разбирает все параметры', () => {
    const query = parseEventListQuery(
      {
        city: 'MSK',
        category: 'cinema',
        dateFrom: '2027-01-01',
        dateTo: '2027-01-31',
        free: 'true',
        q: '  джаз ',
        sort: 'title',
        page: '2',
        pageSize: '10',
      },
      'spb',
    );
    expect(query).toMatchObject({
      city: 'msk',
      category: 'cinema',
      free: true,
      q: 'джаз',
      sort: 'title',
      page: 2,
      pageSize: 10,
    });
    expect(query.dateFrom?.toISOString()).toBe('2027-01-01T00:00:00.000Z');
    expect(query.dateTo?.toISOString()).toBe('2027-01-31T23:59:59.999Z');
  });

  it('free=false не ограничивает по цене', () => {
    expect(parseEventListQuery({ free: 'false' }, 'spb').free).toBeUndefined();
  });

  it('принимает полную дату ISO 8601', () => {
    const query = parseEventListQuery({ dateFrom: '2027-01-01T10:30:00Z' }, 'spb');
    expect(query.dateFrom?.toISOString()).toBe('2027-01-01T10:30:00.000Z');
  });

  it('пустые значения считаются отсутствующими', () => {
    expect(parseEventListQuery({ q: '  ', category: '' }, 'spb')).toMatchObject({
      q: undefined,
      category: undefined,
    });
  });

  it.each([
    [{ category: 'opera' }],
    [{ free: 'да' }],
    [{ sort: 'price' }],
    [{ city: 'Москва' }],
    [{ page: '0' }],
    [{ page: '1.5' }],
    [{ page: '-1' }],
    [{ pageSize: '51' }],
    [{ dateFrom: 'вчера' }],
    [{ dateFrom: '2027-13-45' }],
    [{ dateFrom: '2027-03-01', dateTo: '2027-02-01' }],
    [{ q: 'я'.repeat(101) }],
    [{ q: ['a', 'b'] }],
  ])('отклоняет неверные параметры %j', (raw) => {
    expect(() => parseEventListQuery(raw, 'spb')).toThrow(ValidationError);
  });
});
