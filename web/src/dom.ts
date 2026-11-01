type Child = Node | string | null | undefined | false;

/** Создаёт элемент. Текст вставляется через textContent/createTextNode, поэтому XSS через данные API невозможен. */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | boolean | undefined> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === false) continue;
    if (key === 'class') node.className = String(value);
    else if (value === true) node.setAttribute(key, '');
    else node.setAttribute(key, value);
  }
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    node.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

/** Пропускает только http(s)-ссылки на картинки. */
export function safeImageUrl(url: string | null): string | null {
  if (url === null) return null;
  return /^https?:\/\//i.test(url) ? url : null;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatPrice(event: { isFree: boolean; price: string | null }): string {
  if (event.isFree) return 'Бесплатно';
  return event.price ?? 'Цена не указана';
}
