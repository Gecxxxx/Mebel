import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyFilters, readFilters, writeFilters, filterProducts } from '../src/lib/catalog-state.js';

test('catalog links restore search, price, sort and favorites without losing unrelated query values', () => {
  const filters = { search: 'Фред', brand: 'StolProm', ceiling: '10000', sort: 'low', onlySaved: true };
  const query = writeFilters('?utm_source=demo&q=old', filters);
  assert.deepEqual(readFilters(query, ['StolProm']), filters);
  assert.equal(new URLSearchParams(query).get('utm_source'), 'demo');
  assert.equal(writeFilters(query, emptyFilters), 'utm_source=demo');
});

test('invalid shared filter values cannot produce broken select or price state', () => {
  for (const price of ['-5', 'Infinity', 'abc', '0']) {
    assert.deepEqual(readFilters(`brand=unknown&price=${price}&sort=invalid&saved=yes`, ['StolProm']), emptyFilters);
  }
});

test('search handles Cyrillic ё, combines saved/price/brand filters and does not reorder source products', () => {
  const products = [
    { id: 'a', name: 'Стул Тёплый', brand: 'Ателье', price: 5000 },
    { id: 'b', name: 'Стул Теплый', brand: 'Ателье', price: 3000 },
    { id: 'c', name: 'Стул Тёплый', brand: 'Другой', price: 1000 },
    { id: 'd', name: 'Стул Тёплый', brand: 'Ателье', price: 0 },
  ];
  const filters = { ...emptyFilters, search: 'ТЕПЛЫЙ', brand: 'Ателье', ceiling: '6000', sort: 'low', onlySaved: true };
  assert.deepEqual(filterProducts(products, filters, ['a', 'b', 'c', 'd']).map(p => p.id), ['b', 'a']);
  assert.deepEqual(products.map(p => p.id), ['a', 'b', 'c', 'd']);
  assert.deepEqual(filterProducts(products, { ...filters, ceiling: '2000' }, ['a', 'b']), []);
});
