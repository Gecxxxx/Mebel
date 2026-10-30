export const emptyFilters = { search: '', brand: '', ceiling: '', sort: 'recommended', onlySaved: false };
const sorts = ['recommended', 'low', 'high', 'name'];

export function readFilters(query, brands) {
  const p = new URLSearchParams(query);
  const ceiling = Number(p.get('price'));
  return {
    search: (p.get('q') || '').slice(0, 150),
    brand: brands.includes(p.get('brand')) ? p.get('brand') : '',
    ceiling: Number.isFinite(ceiling) && ceiling > 0 ? String(ceiling) : '',
    sort: sorts.includes(p.get('sort')) ? p.get('sort') : 'recommended',
    onlySaved: p.get('saved') === '1',
  };
}

export function writeFilters(query, filters) {
  const p = new URLSearchParams(query);
  for (const key of ['q', 'brand', 'price', 'sort', 'saved']) p.delete(key);
  if (filters.search.trim()) p.set('q', filters.search.trim());
  if (filters.brand) p.set('brand', filters.brand);
  if (Number(filters.ceiling) > 0) p.set('price', filters.ceiling);
  if (filters.sort !== 'recommended') p.set('sort', filters.sort);
  if (filters.onlySaved) p.set('saved', '1');
  return p.toString();
}

export function filterProducts(products, filters, favorites) {
  const normalize = s => s.toLocaleLowerCase('ru').replaceAll('ё', 'е');
  const q = normalize(filters.search.trim());
  const list = products.filter(p =>
    (!q || normalize(`${p.name} ${p.brand}`).includes(q)) &&
    (!filters.brand || p.brand === filters.brand) &&
    (!filters.ceiling || (p.price > 0 && p.price <= Number(filters.ceiling))) &&
    (!filters.onlySaved || favorites.includes(p.id)));
  if (filters.sort === 'low') list.sort((a, b) => (a.price || Infinity) - (b.price || Infinity));
  if (filters.sort === 'high') list.sort((a, b) => b.price - a.price);
  if (filters.sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  return list;
}
