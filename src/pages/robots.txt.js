import { href } from '../lib/urls.js';

export function GET({ site }) {
  const sitemap = new URL(href('sitemap.xml'), site || 'https://gecxxxx.github.io').href;
  return new Response(`User-agent: *\nAllow: /\nDisallow: ${href('api/')}\nSitemap: ${sitemap}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
