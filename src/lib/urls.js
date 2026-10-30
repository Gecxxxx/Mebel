export const base = import.meta.env.BASE_URL.replace(/\/$/, '');
export const href = (path = '') => `${base}/${path.replace(/^\/+/, '')}`;
export const asset = (path) => href(`assets/${path}`);
export const money = (value) => Number(value) > 0 ? new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value) + ' ₽' : 'По запросу';
export const productUrl = (p) => href(`catalog/${p.category}/${p.slug}/`);
export const requestUrl = (kind = 'Кухня', comment = '') => href(`request/?${new URLSearchParams({ kind, comment })}`);
