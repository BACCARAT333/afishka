import type { AuthResult, EventDto, EventFilters, EventPage } from './types';

const TOKEN_KEY = 'afishka_token';

export class ApiError extends Error {
  public constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const tokenStore = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
  clear: (): void => localStorage.removeItem(TOKEN_KEY),
};

/** Сообщение для случая, когда сервер не прислал свой текст ошибки (например, прокси Vite при остановленном сервере отдаёт пустой 500). */
function messageByStatus(status: number): string {
  if (status >= 500) return 'Сервер недоступен или не отвечает. Попробуйте позже.';
  if (status === 404) return 'Не найдено';
  return 'Ошибка запроса';
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body !== undefined) headers.set('Content-Type', 'application/json');
  const token = tokenStore.get();
  if (token !== null) headers.set('Authorization', `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(path, { ...init, headers });
  } catch {
    throw new ApiError(0, 'Нет связи с сервером. Проверьте, что он запущен.');
  }

  if (response.status === 204) return undefined as T;
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const fromServer =
      typeof body === 'object' && body !== null && 'error' in body
        ? (body as { error: { message?: unknown } }).error.message
        : undefined;
    throw new ApiError(
      response.status,
      typeof fromServer === 'string' ? fromServer : messageByStatus(response.status),
    );
  }
  return body as T;
}

export const api = {
  listEvents(filters: EventFilters): Promise<EventPage> {
    const params = new URLSearchParams({
      city: filters.city,
      page: String(filters.page),
      pageSize: '12',
    });
    if (filters.category !== '') params.set('category', filters.category);
    if (filters.dateFrom !== '') params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo !== '') params.set('dateTo', filters.dateTo);
    if (filters.free) params.set('free', 'true');
    if (filters.q.trim() !== '') params.set('q', filters.q.trim());
    return request<EventPage>(`/api/events?${params.toString()}`);
  },
  getEvent: (id: string): Promise<EventDto> =>
    request<EventDto>(`/api/events/${encodeURIComponent(id)}`),
  register: (email: string, password: string): Promise<AuthResult> =>
    request<AuthResult>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  login: (email: string, password: string): Promise<AuthResult> =>
    request<AuthResult>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  listFavorites: (): Promise<{ items: EventDto[] }> => request('/api/favorites'),
  addFavorite: (eventId: string): Promise<void> =>
    request(`/api/favorites/${encodeURIComponent(eventId)}`, { method: 'POST' }),
  removeFavorite: (eventId: string): Promise<void> =>
    request(`/api/favorites/${encodeURIComponent(eventId)}`, { method: 'DELETE' }),
};
