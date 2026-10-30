import { routes } from '../data/routes.js';
import { href } from '../lib/urls.js';
export function GET({ site }) {
  const urls = ['', ...routes.filter(r => !['request', 'privacy'].includes(r.path)).map(r => `${r.path}/`)];
  const xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + urls.map(p => `<url><loc>${new URL(href(p), site || 'https://gecxxxx.github.io').href}</loc></url>`).join('') + '</urlset>';
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
