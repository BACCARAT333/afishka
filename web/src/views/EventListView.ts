import { api } from '../api';
import { el } from '../dom';
import { CATEGORY_LABELS, CITIES, type EventCategory, type EventFilters } from '../types';
import { errorBox, eventCard } from './components';

// Фильтры хранятся между переходами, чтобы после возврата со страницы события список не сбрасывался.
const filters: EventFilters = {
  city: 'spb',
  category: '',
  dateFrom: '',
  dateTo: '',
  free: false,
  q: '',
  page: 1,
};

export function renderEventList(root: HTMLElement): void {
  const results = el('div', { class: 'results' });
  const pager = el('div', { class: 'pager' });
  const message = el('div', {});

  const showError = (text: string): void => {
    message.replaceChildren(errorBox(text));
  };

  const load = async (): Promise<void> => {
    message.replaceChildren();
    results.replaceChildren(el('p', { class: 'muted' }, 'Загрузка…'));
    pager.replaceChildren();
    try {
      const page = await api.listEvents(filters);
      if (page.items.length === 0) {
        results.replaceChildren(
          el('p', { class: 'muted' }, 'Ничего не найдено. Попробуйте изменить фильтры.'),
        );
        return;
      }
      results.replaceChildren(...page.items.map((event) => eventCard(event, showError)));
      const prev = el(
        'button',
        { type: 'button', class: 'btn', disabled: page.page <= 1 },
        '← Назад',
      );
      const next = el(
        'button',
        { type: 'button', class: 'btn', disabled: page.page >= page.totalPages },
        'Вперёд →',
      );
      prev.addEventListener('click', () => {
        filters.page -= 1;
        void load();
      });
      next.addEventListener('click', () => {
        filters.page += 1;
        void load();
      });
      pager.replaceChildren(
        prev,
        el(
          'span',
          { class: 'muted' },
          `Страница ${page.page} из ${page.totalPages} · всего ${page.total}`,
        ),
        next,
      );
    } catch (error) {
      results.replaceChildren();
      showError(error instanceof Error ? error.message : 'Не удалось загрузить события');
    }
  };

  const city = el('select', { name: 'city' });
  for (const [code, name] of Object.entries(CITIES)) {
    city.append(el('option', { value: code, selected: code === filters.city }, name));
  }
  const category = el('select', { name: 'category' }, el('option', { value: '' }, 'Все категории'));
  for (const [code, name] of Object.entries(CATEGORY_LABELS)) {
    category.append(el('option', { value: code, selected: code === filters.category }, name));
  }
  const dateFrom = el('input', { type: 'date', name: 'dateFrom', value: filters.dateFrom });
  const dateTo = el('input', { type: 'date', name: 'dateTo', value: filters.dateTo });
  const free = el('input', { type: 'checkbox', name: 'free', checked: filters.free });
  const q = el('input', {
    type: 'search',
    name: 'q',
    placeholder: 'Поиск по названию и описанию',
    value: filters.q,
  });

  const form = el(
    'form',
    { class: 'filters' },
    el('label', {}, 'Город', city),
    el('label', {}, 'Категория', category),
    el('label', {}, 'С даты', dateFrom),
    el('label', {}, 'По дату', dateTo),
    el('label', { class: 'inline' }, free, 'Только бесплатные'),
    el('label', { class: 'grow' }, 'Поиск', q),
    el('button', { type: 'submit', class: 'btn primary' }, 'Найти'),
  );
  form.addEventListener('submit', (submitEvent) => {
    submitEvent.preventDefault();
    filters.city = city.value;
    filters.category = category.value as EventCategory | '';
    filters.dateFrom = dateFrom.value;
    filters.dateTo = dateTo.value;
    filters.free = free.checked;
    filters.q = q.value;
    filters.page = 1;
    void load();
  });

  root.replaceChildren(el('h1', {}, 'Афиша событий'), form, message, results, pager);
  void load();
}
