import { useEffect, useMemo, useState } from 'react';
import { asset, money, productUrl } from '../lib/urls.js';
import Icon from './Icon.jsx';

const key = 'prioritet-favorites';
export function useFavorites() {
  const [favorites, setFavorites] = useState([]);
  useEffect(() => { try { const stored = JSON.parse(localStorage.getItem(key) || '[]'); if (Array.isArray(stored)) setFavorites(stored.filter(x => typeof x === 'string')); } catch {} }, []);
  const toggle = id => setFavorites(previous => { const next = previous.includes(id) ? previous.filter(x => x !== id) : [...previous, id]; try { localStorage.setItem(key, JSON.stringify(next)); } catch {} return next; });
  return [favorites, toggle];
}
export function ProductCard({ product, saved = false, onFavorite, ready = true }) {
  return <article className="catalog-card">
    <div className="catalog-card-image"><a href={productUrl(product)} tabIndex={-1} aria-hidden="true"><img src={asset(product.images[0])} alt="" loading="lazy" width="600" height="600" /></a>{onFavorite && <button disabled={!ready} className={`favorite-button ${saved ? 'saved' : ''}`} aria-label={`${saved ? 'Убрать из избранного' : 'В избранное'}: ${product.name}`} aria-pressed={saved} onClick={() => onFavorite(product.id)}><Icon name={saved ? 'heart-fill' : 'heart'} size={23} /></button>}</div>
    <div className="catalog-card-meta"><p>{product.brand || 'Подборка ателье'}</p><h3><a href={productUrl(product)}>{product.name}</a></h3><div className="catalog-card-bottom"><span>{product.maxPrice > product.price ? 'от ' : ''}{money(product.price)}</span><a href={productUrl(product)} aria-label={`Подробнее: ${product.name}`}><Icon /></a></div></div>
  </article>;
}
export default function Catalog({ products }) {
  const [search, setSearch] = useState(''); const [brand, setBrand] = useState(''); const [sort, setSort] = useState('recommended'); const [ceiling, setCeiling] = useState(''); const [onlySaved, setOnlySaved] = useState(false); const [limit, setLimit] = useState(18);
  const [favorites, toggle] = useFavorites();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => { const p = new URLSearchParams(location.search); setSearch(p.get('q') || ''); setReady(true); }, []);
  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))].sort();
  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('ru').replaceAll('ё', 'е');
    const list = products.filter(p => (!q || `${p.name} ${p.brand}`.toLocaleLowerCase('ru').replaceAll('ё', 'е').includes(q)) && (!brand || p.brand === brand) && (!ceiling || (p.price > 0 && p.price <= Number(ceiling))) && (!onlySaved || favorites.includes(p.id)));
    return sort === 'low' ? list.sort((a, b) => (a.price || Infinity) - (b.price || Infinity)) : sort === 'high' ? list.sort((a, b) => b.price - a.price) : sort === 'name' ? list.sort((a, b) => a.name.localeCompare(b.name, 'ru')) : list;
  }, [products, search, brand, ceiling, sort, onlySaved, favorites]);
  const reset = () => { setSearch(''); setBrand(''); setCeiling(''); setOnlySaved(false); setSort('recommended'); setLimit(18); };
  return <div className="catalog-explorer">
    <form className={`catalog-filters ${filtersOpen ? 'filters-expanded' : ''}`} role="search" aria-busy={!ready} aria-label="Поиск и фильтры каталога" onSubmit={e => e.preventDefault()}>
      <label className="search-field"><span>Поиск по каталогу</span><div><Icon name="magnifying-glass" size={21} /><input disabled={!ready} type="search" placeholder="Например, Фред" value={search} onChange={e => { setSearch(e.target.value); setLimit(18); }} /></div></label>
      <button disabled={!ready} className="mobile-filter-toggle" type="button" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(!filtersOpen)}>{filtersOpen ? 'Скрыть фильтры' : 'Фильтры и сортировка'}<Icon name="caret-right" size={18} /></button>
      <label><span>Бренд</span><select disabled={!ready} value={brand} onChange={e => { setBrand(e.target.value); setLimit(18); }}><option value="">Все бренды</option>{brands.map(b => <option key={b}>{b}</option>)}</select></label>
      <label><span>Цена из каталога, до ₽</span><input disabled={!ready} type="number" min="0" inputMode="numeric" placeholder="Без ограничения" value={ceiling} onChange={e => { setCeiling(e.target.value); setLimit(18); }} /></label>
      <label><span>Порядок</span><select disabled={!ready} value={sort} onChange={e => setSort(e.target.value)}><option value="recommended">По умолчанию</option><option value="low">Сначала дешевле</option><option value="high">Сначала дороже</option><option value="name">По названию</option></select></label>
    </form>
    <div className="catalog-status"><p role="status">Найдено моделей: <strong>{filtered.length}</strong></p><label className="saved-filter"><input disabled={!ready} type="checkbox" checked={onlySaved} onChange={e => { setOnlySaved(e.target.checked); setLimit(18); }} />Избранное ({favorites.length})</label><button disabled={!ready} className="filter-reset" onClick={reset}>Сбросить фильтры</button></div>
    {filtered.length ? <><div className="catalog-grid">{filtered.slice(0, limit).map(p => <ProductCard key={p.id} product={p} ready={ready} saved={favorites.includes(p.id)} onFavorite={toggle} />)}</div>{limit < filtered.length && <div className="load-more"><button className="button button-outline" disabled={!ready} onClick={() => setLimit(n => n + 18)}>Показать ещё {Math.min(18, filtered.length - limit)}<Icon /></button><span>Показано {Math.min(limit, filtered.length)} из {filtered.length}</span></div>}</> : <div className="empty-results"><h2>{onlySaved ? 'Сохраните то, что нравится.' : 'Давайте попробуем иначе.'}</h2><p>{onlySaved ? 'Нажмите на сердце в карточке — модель останется в избранном в этом браузере.' : 'По этим параметрам моделей не найдено. Измените запрос или сбросьте фильтры.'}</p><button className="button button-outline" onClick={reset}>Показать все модели<Icon /></button></div>}
  </div>;
}
