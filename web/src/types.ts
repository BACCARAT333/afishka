export type EventCategory = 'concert' | 'theater' | 'exhibition' | 'cinema';

export interface VenueDto {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
}

export interface EventDto {
  id: string;
  title: string;
  description: string;
  city: string;
  category: EventCategory;
  startsAt: string;
  endsAt: string | null;
  isFree: boolean;
  price: string | null;
  imageUrl: string | null;
  venue: VenueDto | null;
}

export interface EventPage {
  items: EventDto[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface UserDto {
  id: string;
  email: string;
  createdAt: string;
}

export interface AuthResult {
  user: UserDto;
  token: string;
}

export interface EventFilters {
  city: string;
  category: EventCategory | '';
  dateFrom: string;
  dateTo: string;
  free: boolean;
  q: string;
  page: number;
}

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  concert: 'Концерты',
  theater: 'Театр',
  exhibition: 'Выставки',
  cinema: 'Кино',
};

export const CITIES: Record<string, string> = {
  spb: 'Санкт-Петербург',
  msk: 'Москва',
  ekb: 'Екатеринбург',
  nsk: 'Новосибирск',
};
