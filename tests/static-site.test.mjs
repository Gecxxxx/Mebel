import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('dist/client');
async function filesIn(dir) {
  const result = [];
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, item.name);
    if (item.isDirectory()) result.push(...await filesIn(file)); else result.push(file);
  }
  return result;
}
const files = await filesIn(root);
const htmlFiles = files.filter(f => f.endsWith('.html'));
const index = await readFile(path.join(root, 'index.html'), 'utf8');
const cssPath = [...index.matchAll(/href="([^"]+\.css)"/g)][0]?.[1];
assert.ok(cssPath, 'Compiled page must reference a stylesheet');
const base = cssPath.includes('/Mebel/') ? '/Mebel/' : '/';
function localFile(url, current) {
  const resolved = new URL(url.replaceAll('&amp;', '&'), `https://test.invalid${base}${path.relative(root, current).replaceAll('\\', '/')}`);
  if (resolved.origin !== 'https://test.invalid') return null;
  assert.ok(resolved.pathname.startsWith(base), `Link escapes deployment base: ${resolved.pathname}`);
  let relative = decodeURIComponent(resolved.pathname.slice(base.length));
  if (!path.extname(relative)) relative = path.posix.join(relative, 'index.html');
  return path.join(root, relative);
}

test('every page is standalone HTML with one heading and appropriate indexing for the deployment', async () => {
  const production = /name="robots" content="index,follow"/.test(index);
  const sitemap = await readFile(path.join(root, 'sitemap.xml'), 'utf8');
  const indexablePaths = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => new URL(url).pathname));
  assert.ok(htmlFiles.length > 150, 'Expected all imported product pages, not only a router shell');
  for (const file of htmlFiles) {
    const html = await readFile(file, 'utf8');
    assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, `${file}: one h1 required`);
    assert.match(html, /<title>[^<]+<\/title>/);
    assert.match(html, /name="description" content="[^"]+"/);
    const relative = path.relative(root, file).replaceAll('\\', '/');
    const pathname = base + relative.replace(/index\.html$/, '');
    const expected = production && indexablePaths.has(pathname) ? 'index,follow' : 'noindex,follow';
    assert.ok(html.includes(`name="robots" content="${expected}"`), `${relative}: expected ${expected}`);
    if (production) {
      assert.match(html, /rel="canonical" href="https:\/\/prioritetmebel48\.ru\//);
      assert.doesNotMatch(html, /property="og:(?:url|image)" content="https:\/\/gecxxxx\.github\.io/);
    }
  }
  const robots = await readFile(path.join(root, 'robots.txt'), 'utf8');
  assert.ok(robots.includes(`Sitemap: ${new URL('sitemap.xml', index.match(/rel="canonical" href="([^"]+)"/)[1]).href}`));
});

test('all generated internal navigation and image targets exist under deployment base', async () => {
  const missing = new Set();
  for (const file of htmlFiles) {
    const html = await readFile(file, 'utf8');
    for (const [, url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^(?:https?:|mailto:|tel:|data:|#)/.test(url)) continue;
      const target = localFile(url, file);
      if (target) try { await access(target); } catch { missing.add(path.relative(root, target)); }
    }
  }
  assert.deepEqual([...missing], []);
});

test('all font and image references in compiled CSS resolve', async () => {
  const missing = [];
  for (const file of files.filter(f => f.endsWith('.css'))) {
    const css = await readFile(file, 'utf8');
    for (const [, url] of css.matchAll(/url\(["']?([^)'"\s]+)["']?\)/g)) {
      if (/^(?:https?:|data:)/.test(url)) continue;
      const target = localFile(url, file);
      if (target) try { await access(target); } catch { missing.push(url); }
    }
  }
  assert.deepEqual(missing, []);
});

test('all responsive image variants exist under the deployment base', async () => {
  const missing = new Set();
  for (const file of htmlFiles) {
    const html = await readFile(file, 'utf8');
    for (const [, candidates] of html.matchAll(/srcset="([^"]+)"/gi)) {
      for (const candidate of candidates.split(',')) {
        const url = candidate.trim().split(/\s+/)[0];
        const target = localFile(url, file);
        if (target) try { await access(target); } catch { missing.add(url); }
      }
    }
  }
  assert.deepEqual([...missing], []);
});

test('catalog data preserves real models and keeps product categories consistent', async () => {
  const data = JSON.parse(await readFile('src/data/catalog.json', 'utf8'));
  assert.ok(data.some(p => p.slug === 'stul-fred'));
  assert.ok(!data.some(p => /copy/i.test(p.name)));
  assert.equal(new Set(data.map(p => `${p.category}/${p.slug}`)).size, data.length);
  for (const product of data) {
    assert.ok(['stoly', 'stulya'].includes(product.category));
    assert.ok(product.sourceUrl.startsWith('https://stolyistulya48.ru/'));
    assert.ok(product.images.length > 0);
    for (const image of product.images) await access(path.join(root, 'assets', image));
  }
  const diningPage = await readFile(path.join(root, 'stoly-i-stulya/obedennye-gruppy/index.html'), 'utf8');
  assert.ok(diningPage.includes('каждый предмет подбирается отдельно'), 'Dining groups must describe separate items');
});


test('new navigation, hidden prices and old bookmarked URLs agree', async () => {
  const models = JSON.parse(await readFile('src/data/catalog.json', 'utf8'));
  for (const model of models) {
    const relative = `${model.category}/${model.slug}/index.html`;
    const page = await readFile(path.join(root, 'stoly-i-stulya', relative), 'utf8');
    assert.ok(page.includes('Стоимость уточняйте'));
    assert.doesNotMatch(page, /(?:&quot;|["'])maxPrice(?:&quot;|["']):/);
    assert.doesNotMatch(page, /(?:&quot;|["'])price(?:&quot;|["']):/);
    const legacy = await readFile(path.join(root, 'catalog', relative), 'utf8');
    assert.ok(legacy.includes(`stoly-i-stulya/${model.category}/${model.slug}/`));
    assert.ok(legacy.includes('location.search + location.hash'));
  }
  const furniture = await readFile(path.join(root, 'korpusnaya-mebel/index.html'), 'utf8');
  for (const label of ['Прихожие', 'Гостиные', 'Детские', 'Спальни', 'Встроенные решения', 'Всегда на связи']) assert.ok(furniture.includes(label));
  const sitemap = await readFile(path.join(root, 'sitemap.xml'), 'utf8');
  assert.ok(!sitemap.includes('/catalog/') && !sitemap.includes('/mebel-na-zakaz/'));
});

test('work albums label project and before-installation images, while About and returns preserve requested distinctions', async () => {
  const album = await readFile(path.join(root, 'projects/kuhnya-siniy-i-belyy/index.html'), 'utf8');
  assert.ok(album.includes('До установки мебели'));
  assert.ok(album.includes('Изображение проекта — не фотография готовой кухни'));
  const about = await readFile(path.join(root, 'about/index.html'), 'utf8');
  assert.ok(about.includes('Всегда на связи'));
  assert.ok(about.includes('Официальный дилер фабрики «ГЕОС Идеал» (Беларусь)'));
  const warranty = await readFile(path.join(root, 'warranty/index.html'), 'utf8');
  assert.ok(warranty.includes('Мебель надлежащего качества'));
  assert.ok(warranty.includes('не ограничивает права покупателя при обнаружении недостатков'));
});
