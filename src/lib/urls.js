export const base = import.meta.env.BASE_URL.replace(/\/$/, '');
export const href = (path = '') => `${base}/${path.replace(/^\/+/, '')}`;
export const asset = (path) => href(`assets/${path}`);
export const photoSrc = (photo, width = 960) => asset(`photos/${photo.image}-${width}.webp`);
export const photoSrcSet = photo => [480, 960, 1600].map(width => `${photoSrc(photo, width)} ${width}w`).join(', ');
export const productUrl = (p) => href(`stoly-i-stulya/${p.category}/${p.slug}/`);
export const requestUrl = (kind = 'Кухня', comment = '') => href(`request/?${new URLSearchParams({ kind, comment })}`);
