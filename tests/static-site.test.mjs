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

test('every page is standalone HTML with one heading and noindex during demo', async () => {
  assert.ok(htmlFiles.length > 150, 'Expected all imported product pages, not only a router shell');
  for (const file of htmlFiles) {
    const html = await readFile(file, 'utf8');
    assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, `${file}: one h1 required`);
    assert.match(html, /<title>[^<]+<\/title>/);
    assert.match(html, /name="description" content="[^"]+"/);
    assert.match(html, /name="robots" content="noindex,follow"/);
  }
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
  const diningPage = await readFile(path.join(root, 'catalog/obedennye-gruppy/index.html'), 'utf8');
  assert.ok(diningPage.includes('не за комплект'), 'Individual item prices must not be presented as set prices');
});
