import { api } from '../api';
import { el } from '../dom';
import { session } from '../session';
import { errorBox } from './components';

export function renderAuth(root: HTMLElement, mode: 'login' | 'register'): void {
  const isLogin = mode === 'login';
  const message = el('div', {});
  const email = el('input', {
    type: 'email',
    name: 'email',
    required: true,
    autocomplete: 'email',
  });
  const password = el('input', {
    type: 'password',
    name: 'password',
    required: true,
    minlength: '8',
    autocomplete: isLogin ? 'current-password' : 'new-password',
  });
  const submit = el(
    'button',
    { type: 'submit', class: 'btn primary' },
    isLogin ? 'Войти' : 'Зарегистрироваться',
  );

  const form = el(
    'form',
    { class: 'auth-form' },
    el('h1', {}, isLogin ? 'Вход' : 'Регистрация'),
    el('label', {}, 'Email', email),
    el('label', {}, 'Пароль', password),
    message,
    submit,
    el(
      'p',
      { class: 'muted' },
      isLogin ? 'Нет аккаунта? ' : 'Уже есть аккаунт? ',
      el(
        'a',
        { href: isLogin ? '#/register' : '#/login' },
        isLogin ? 'Зарегистрируйтесь' : 'Войдите',
      ),
    ),
  );
  form.addEventListener('submit', (submitEvent) => {
    submitEvent.preventDefault();
    submit.disabled = true;
    message.replaceChildren();
    const action = isLogin ? api.login : api.register;
    action(email.value.trim(), password.value)
      .then((result) => session.start(result))
      .then(() => {
        location.hash = '#/';
      })
      .catch((error: unknown) => {
        message.replaceChildren(errorBox(error instanceof Error ? error.message : 'Ошибка'));
      })
      .finally(() => {
        submit.disabled = false;
      });
  });
  root.replaceChildren(form);
}
