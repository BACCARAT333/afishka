import { ValidationError } from '../../shared/errors';
import type { EventCategory } from './models/Event';
import type { EventListQuery } from './EventService';
import type { SortKey } from './strategies';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

const CATEGORIES: readonly EventCategory[] = ['concert', 'theater', 'exhibition', 'cinema'];
const SORT_KEYS: readonly SortKey[] = ['date', 'title'];
const CITY_PATTERN = /^[a-z0-9-]{2,20}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}/;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_QUERY_LENGTH = 100;

type RawQuery = Record<string, unknown>;

function readString(raw: RawQuery, key: string): string | undefined {
  const value = raw[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'string') {
    throw new ValidationError(`Параметр ${key} должен быть строкой`);
  }
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function readDate(raw: RawQuery, key: string, endOfDay: boolean): Date | undefined {
  const value = readString(raw, key);
  if (value === undefined) return undefined;
  const text = DATE_ONLY_PATTERN.test(value)
    ? `${value}${endOfDay ? 'T23:59:59.999Z' : 'T00:00:00.000Z'}`
    : value;
  const date = new Date(text);
  if (!DATE_PATTERN.test(value) || Number.isNaN(date.getTime())) {
    throw new ValidationError(`Параметр ${key}: ожидается дата ГГГГ-ММ-ДД или ISO 8601`);
  }
  return date;
}

function readInt(raw: RawQuery, key: string, fallback: number, min: number, max: number): number {
  const value = readString(raw, key);
  if (value === undefined) return fallback;
  const number = Number(value);
  if (!/^\d+$/.test(value) || number < min || number > max) {
    throw new ValidationError(`Параметр ${key}: ожидается целое число от ${min} до ${max}`);
  }
  return number;
}

/** Проверяет параметры GET /api/events и превращает их в EventListQuery. */
export function parseEventListQuery(raw: RawQuery, defaultCity: string): EventListQuery {
  const city = (readString(raw, 'city') ?? defaultCity).toLowerCase();
  if (!CITY_PATTERN.test(city)) {
    throw new ValidationError('Параметр city: ожидается код города, например spb или msk');
  }

  const category = readString(raw, 'category');
  if (category !== undefined && !(CATEGORIES as readonly string[]).includes(category)) {
    throw new ValidationError(`Параметр category: допустимо ${CATEGORIES.join(', ')}`);
  }

  const free = readString(raw, 'free');
  if (free !== undefined && free !== 'true' && free !== 'false') {
    throw new ValidationError('Параметр free: допустимо true или false');
  }

  const q = readString(raw, 'q');
  if (q !== undefined && q.length > MAX_QUERY_LENGTH) {
    throw new ValidationError(`Параметр q: не длиннее ${MAX_QUERY_LENGTH} символов`);
  }

  const sort = readString(raw, 'sort') ?? 'date';
  if (!(SORT_KEYS as readonly string[]).includes(sort)) {
    throw new ValidationError(`Параметр sort: допустимо ${SORT_KEYS.join(', ')}`);
  }

  const dateFrom = readDate(raw, 'dateFrom', false);
  const dateTo = readDate(raw, 'dateTo', true);
  if (dateFrom !== undefined && dateTo !== undefined && dateTo < dateFrom) {
    throw new ValidationError('Параметр dateTo не может быть раньше dateFrom');
  }

  return {
    city,
    category: category as EventCategory | undefined,
    dateFrom,
    dateTo,
    // free=false означает «без ограничения по цене», а не «только платные»
    free: free === 'true' ? true : undefined,
    q,
    sort: sort as SortKey,
    page: readInt(raw, 'page', 1, 1, 100_000),
    pageSize: readInt(raw, 'pageSize', DEFAULT_PAGE_SIZE, 1, MAX_PAGE_SIZE),
  };
}
