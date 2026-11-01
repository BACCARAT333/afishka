import { el, formatDate, formatPrice, safeImageUrl } from '../dom';
import { session } from '../session';
import { CATEGORY_LABELS, type EventDto } from '../types';

export function errorBox(message: string): HTMLElement {
  return el('div', { class: 'alert', role: 'alert' }, message);
}

export function favoriteButton(
  eventId: string,
  onError: (message: string) => void,
): HTMLButtonElement {
  const button = el('button', { type: 'button', class: 'btn btn-fav' });
  const render = (): void => {
    const active = session.isFavorite(eventId);
    button.textContent = active ? '★ В избранном' : '☆ В избранное';
    button.classList.toggle('active', active);
  };
  render();
  button.addEventListener('click', () => {
    if (session.currentUser === null) {
      location.hash = '#/login';
      return;
    }
    button.disabled = true;
    session
      .toggleFavorite(eventId)
      .then(render)
      .catch((error: unknown) => onError(error instanceof Error ? error.message : 'Ошибка'))
      .finally(() => {
        button.disabled = false;
      });
  });
  return button;
}

export function imageBlock(event: EventDto, className: string): HTMLElement {
  const url = safeImageUrl(event.imageUrl);
  const placeholder = (): HTMLElement =>
    el('div', { class: `${className} placeholder` }, CATEGORY_LABELS[event.category]);
  if (url === null) return placeholder();
  const img = el('img', { class: className, src: url, alt: event.title, loading: 'lazy' });
  // Если картинка не загрузилась (битая ссылка), показываем заглушку вместо пустого места
  img.addEventListener('error', () => img.replaceWith(placeholder()));
  return img;
}

export function eventCard(event: EventDto, onError: (message: string) => void): HTMLElement {
  return el(
    'article',
    { class: 'card' },
    imageBlock(event, 'card-img'),
    el(
      'div',
      { class: 'card-body' },
      el('span', { class: 'badge' }, CATEGORY_LABELS[event.category]),
      el('h3', {}, el('a', { href: `#/event/${encodeURIComponent(event.id)}` }, event.title)),
      el('p', { class: 'muted' }, formatDate(event.startsAt)),
      event.venue !== null ? el('p', { class: 'muted' }, event.venue.name) : null,
      el(
        'div',
        { class: 'card-footer' },
        el('strong', { class: event.isFree ? 'free' : '' }, formatPrice(event)),
        favoriteButton(event.id, onError),
      ),
    ),
  );
}
