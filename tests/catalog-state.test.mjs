import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyFilters, readFilters, writeFilters, filterProducts } from '../src/lib/catalog-state.js';
import products from '../src/data/products.js';

test('shared links restore search, brand, sort and favorites while preserving unrelated query values', () => {
  const filters = { search: 'Фред', brand: 'StolProm', sort: 'name', onlySaved: true };
  const query = writeFilters('?utm_source=demo&q=old&price=5000&sort=low', filters);
  assert.deepEqual(readFilters(query, ['StolProm']), filters);
  assert.equal(new URLSearchParams(query).get('utm_source'), 'demo');
  assert.equal(new URLSearchParams(query).has('price'), false);
  assert.equal(writeFilters(query, emptyFilters), 'utm_source=demo');
});

test('historical price links and unknown filter values cannot change model selection', () => {
  for (const sort of ['low', 'high', 'invalid']) {
    assert.deepEqual(readFilters(`brand=unknown&price=100&sort=${sort}&saved=yes`, ['StolProm']), emptyFilters);
  }
  const filters = readFilters('?price=100&sort=low', []);
  assert.equal(filterProducts(products, filters, []).length, 168);
});

test('Cyrillic search, brand and saved filters work together without reordering the source', () => {
  const models = [
    { id: 'a', name: 'Стул Тёплый Б', brand: 'Ателье' },
    { id: 'b', name: 'Стул Теплый А', brand: 'Ателье' },
    { id: 'c', name: 'Стул Тёплый', brand: 'Другой' },
    { id: 'd', name: 'Стол', brand: 'Ателье' },
  ];
  const filters = { ...emptyFilters, search: 'ТЕПЛЫЙ', brand: 'Ателье', sort: 'name', onlySaved: true };
  assert.deepEqual(filterProducts(models, filters, ['a', 'b', 'c', 'd']).map(p => p.id), ['b', 'a']);
  assert.deepEqual(models.map(p => p.id), ['a', 'b', 'c', 'd']);
  assert.deepEqual(filterProducts(models, { ...filters, search: 'несуществующий' }, ['a', 'b']), []);
});

test('public models and variant data never expose archived prices', () => {
  assert.equal(products.length, 168);
  const publicData = JSON.stringify(products);
  assert.doesNotMatch(publicData, /"(?:price|maxPrice)":/);
  assert.ok(products.every(p => p.editions.every(e => e.values)));
});
