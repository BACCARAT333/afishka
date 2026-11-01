/** Типы «сырых» ответов KudaGo API v1.4 (только используемые поля). */
export interface KudaGoDate {
  start: number | null;
  end: number | null;
}

export interface KudaGoPlace {
  id: number;
  title?: string;
  address?: string;
  location?: string;
  coords?: { lat: number; lon: number } | null;
}

export interface KudaGoImage {
  image: string;
}

export interface KudaGoEventRaw {
  id: number;
  title: string;
  description?: string;
  dates?: KudaGoDate[];
  place?: KudaGoPlace | null;
  images?: KudaGoImage[];
  price?: string;
  is_free?: boolean;
  categories?: string[];
  tags?: string[];
  age_restriction?: string | number | null;
}

export interface KudaGoListResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface KudaGoEventsQuery {
  location: string;
  categories?: string;
  actualSince?: number;
  actualUntil?: number;
  isFree?: boolean;
  page?: number;
  pageSize?: number;
}
