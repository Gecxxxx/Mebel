export const emptyFilters = { search: '', brand: '', sort: 'recommended', onlySaved: false };
const sorts = ['recommended', 'name'];
export function readFilters(query, brands) {
  const p = new URLSearchParams(query);
  return {
    search: (p.get('q') || '').slice(0, 150),
    brand: brands.includes(p.get('brand')) ? p.get('brand') : '',
    sort: sorts.includes(p.get('sort')) ? p.get('sort') : 'recommended',
    onlySaved: p.get('saved') === '1',
  };
}
export function writeFilters(query, filters) {
  const p = new URLSearchParams(query);
  // Discard historical price filters, including on old shared links.
  for (const key of ['q', 'brand', 'price', 'sort', 'saved']) p.delete(key);
  if (filters.search.trim()) p.set('q', filters.search.trim());
  if (filters.brand) p.set('brand', filters.brand);
  if (filters.sort === 'name') p.set('sort', filters.sort);
  if (filters.onlySaved) p.set('saved', '1');
  return p.toString();
}
export function filterProducts(products, filters, favorites) {
  const normalize = s => s.toLocaleLowerCase('ru').replaceAll('ё', 'е');
  const q = normalize(filters.search.trim());
  const list = products.filter(p =>
    (!q || normalize(`${p.name} ${p.brand}`).includes(q)) &&
    (!filters.brand || p.brand === filters.brand) &&
    (!filters.onlySaved || favorites.includes(p.id)));
  if (filters.sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  return list;
}
