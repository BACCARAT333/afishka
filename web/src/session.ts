import { api, ApiError, tokenStore } from './api';
import type { AuthResult, UserDto } from './types';

const USER_KEY = 'afishka_user';

/** Состояние сессии: текущий пользователь и множество id избранных событий. */
class Session {
  private user: UserDto | null = null;
  private favoriteIds = new Set<string>();
  private listeners: Array<() => void> = [];

  public constructor() {
    const raw = localStorage.getItem(USER_KEY);
    if (raw !== null && tokenStore.get() !== null) {
      try {
        this.user = JSON.parse(raw) as UserDto;
      } catch {
        this.clearStorage();
      }
    }
  }

  public get currentUser(): UserDto | null {
    return this.user;
  }

  public isFavorite(eventId: string): boolean {
    return this.favoriteIds.has(eventId);
  }

  public onChange(listener: () => void): void {
    this.listeners.push(listener);
  }

  public start(result: AuthResult): Promise<void> {
    tokenStore.set(result.token);
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));
    this.user = result.user;
    return this.refreshFavorites();
  }

  public logout(): void {
    this.clearStorage();
    this.user = null;
    this.favoriteIds.clear();
    this.emit();
  }

  /** Загружает id избранного. Если токен устарел (401), выходит из аккаунта. */
  public async refreshFavorites(): Promise<void> {
    if (this.user === null) return;
    try {
      const { items } = await api.listFavorites();
      this.favoriteIds = new Set(items.map((event) => event.id));
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        this.logout();
        return;
      }
    }
    this.emit();
  }

  public async toggleFavorite(eventId: string): Promise<boolean> {
    if (this.isFavorite(eventId)) {
      await api.removeFavorite(eventId);
      this.favoriteIds.delete(eventId);
    } else {
      await api.addFavorite(eventId);
      this.favoriteIds.add(eventId);
    }
    this.emit();
    return this.isFavorite(eventId);
  }

  private clearStorage(): void {
    tokenStore.clear();
    localStorage.removeItem(USER_KEY);
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }
}

export const session = new Session();
