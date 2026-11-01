import { el } from './dom';
import { session } from './session';
import { renderAuth } from './views/AuthView';
import { renderEventDetail } from './views/EventDetailView';
import { renderEventList } from './views/EventListView';
import { renderFavorites } from './views/FavoritesView';

const appRoot = document.getElementById('app');
const navRoot = document.getElementById('nav');
if (appRoot === null || navRoot === null) throw new Error('Не найден корневой элемент страницы');
const app: HTMLElement = appRoot;
const nav: HTMLElement = navRoot;

function renderNav(): void {
  const user = session.currentUser;
  if (user === null) {
    nav.replaceChildren(
      el('a', { href: '#/login' }, 'Войти'),
      el('a', { href: '#/register' }, 'Регистрация'),
    );
    return;
  }
  const logout = el('button', { type: 'button', class: 'link' }, 'Выйти');
  logout.addEventListener('click', () => {
    session.logout();
    location.hash = '#/';
  });
  nav.replaceChildren(
    el('a', { href: '#/favorites' }, 'Избранное'),
    el('span', { class: 'muted' }, user.email),
    logout,
  );
}

/** Простой маршрутизатор на location.hash: #/, #/event/:id, #/login, #/register, #/favorites. */
function route(): void {
  const path = location.hash.replace(/^#/, '') || '/';
  const eventMatch = /^\/event\/(.+)$/.exec(path);
  if (eventMatch?.[1] !== undefined) {
    void renderEventDetail(app, decodeURIComponent(eventMatch[1]));
  } else if (path === '/login') {
    renderAuth(app, 'login');
  } else if (path === '/register') {
    renderAuth(app, 'register');
  } else if (path === '/favorites') {
    void renderFavorites(app);
  } else {
    renderEventList(app);
  }
  window.scrollTo(0, 0);
}

session.onChange(renderNav);
window.addEventListener('hashchange', route);
renderNav();
route();
void session.refreshFavorites();
