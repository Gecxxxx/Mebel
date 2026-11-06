import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';

test('the supplied PDF stays intact and video is loaded only on demand', async () => {
  const sources = JSON.parse(await readFile('src/data/marketing-sources.json', 'utf8'));
  const pdf = await readFile('public/assets/marketing/prioritet-projects-2026.pdf');
  assert.equal(createHash('sha256').update(pdf).digest('hex'), sources.catalog.sha256);
  const video = await stat('public/assets/marketing/atelier-introduction.mp4');
  assert.ok(video.size < 10 * 1024 * 1024, 'Website video should remain comfortably below Pages file limits');
  for (const path of ['index.html', 'about/index.html']) {
    const page = await readFile(`dist/client/${path}`, 'utf8');
    assert.equal((page.match(/<video\b/g) || []).length, 1);
    assert.match(page, /<video[^>]*preload="none"/);
    assert.match(page, /atelier-poster\.webp/);
    assert.match(page, /atelier-introduction\.mp4/);
    assert.match(page, /id="atelier-video"/);
  }
});

test('promotion terms and project prices appear in the intended sections without extending historical dining prices', async () => {
  const home = await readFile('dist/client/index.html', 'utf8');
  assert.match(home, /id="furniture-promotion"/);
  for (const term of ['Сертификат действует вместо подарков', 'три месяца', 'два и более предмета']) assert.ok(home.includes(term));
  const kitchen = await readFile('dist/client/kuhni/index.html', 'utf8');
  const prices = html => [...html.matchAll(/class="example-price">([^<]+)/g)].map(match => match[1].replace(/\s/g, ''));
  assert.deepEqual(prices(kitchen), ['160000₽', '385600₽', '1200000₽']);
  assert.ok(kitchen.includes('Стоимость этого проекта со сборкой'));
  const furniture = await readFile('dist/client/korpusnaya-mebel/index.html', 'utf8');
  assert.deepEqual(prices(furniture), ['177000₽']);
  assert.ok(furniture.includes('Шкаф с рифлёными фасадами'));
  for (const path of ['request', 'privacy']) assert.ok(!(await readFile(`dist/client/${path}/index.html`, 'utf8')).includes('id="furniture-promotion"'));
});
