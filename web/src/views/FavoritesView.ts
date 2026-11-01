import { api } from '../api';
import { el } from '../dom';
import { session } from '../session';
import { errorBox, eventCard } from './components';

export async function renderFavorites(root: HTMLElement): Promise<void> {
  if (session.currentUser === null) {
    location.hash = '#/login';
    return;
  }
  root.replaceChildren(el('h1', {}, 'Избранное'), el('p', { class: 'muted' }, 'Загрузка…'));
  try {
    const { items } = await api.listFavorites();
    const message = el('div', {});
    root.replaceChildren(
      el('h1', {}, 'Избранное'),
      message,
      items.length === 0
        ? el('p', { class: 'muted' }, 'Пока пусто. Добавляйте события звёздочкой в афише.')
        : el(
            'div',
            { class: 'results' },
            ...items.map((event) =>
              eventCard(event, (text) => message.replaceChildren(errorBox(text))),
            ),
          ),
    );
  } catch (error) {
    root.replaceChildren(
      el('h1', {}, 'Избранное'),
      errorBox(error instanceof Error ? error.message : 'Ошибка'),
    );
  }
}
