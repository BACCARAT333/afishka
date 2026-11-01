import { api } from '../api';
import { el, formatDate, formatPrice } from '../dom';
import { CATEGORY_LABELS } from '../types';
import { errorBox, favoriteButton, imageBlock } from './components';

export async function renderEventDetail(root: HTMLElement, id: string): Promise<void> {
  root.replaceChildren(el('p', { class: 'muted' }, 'Загрузка…'));
  const back = el('a', { href: '#/', class: 'back' }, '← К списку');
  try {
    const event = await api.getEvent(id);
    const message = el('div', {});
    const dates =
      event.endsAt === null
        ? formatDate(event.startsAt)
        : `${formatDate(event.startsAt)} — ${formatDate(event.endsAt)}`;
    root.replaceChildren(
      back,
      el(
        'article',
        { class: 'detail' },
        imageBlock(event, 'detail-img'),
        el(
          'div',
          { class: 'detail-body' },
          el('span', { class: 'badge' }, CATEGORY_LABELS[event.category]),
          el('h1', {}, event.title),
          el('p', {}, el('strong', {}, 'Когда: '), dates),
          event.venue !== null
            ? el('p', {}, el('strong', {}, 'Где: '), `${event.venue.name}, ${event.venue.address}`)
            : null,
          el('p', {}, el('strong', {}, 'Цена: '), formatPrice(event)),
          favoriteButton(event.id, (text) => message.replaceChildren(errorBox(text))),
          message,
          el('p', { class: 'description' }, event.description),
        ),
      ),
    );
  } catch (error) {
    root.replaceChildren(
      back,
      errorBox(error instanceof Error ? error.message : 'Не удалось загрузить событие'),
    );
  }
}
