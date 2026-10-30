import { useEffect, useMemo, useState } from 'react';
import { asset, money, productUrl } from '../lib/urls.js';
import Icon from './Icon.jsx';
import { emptyFilters, readFilters, writeFilters, filterProducts } from '../lib/catalog-state.js';

const key = 'prioritet-favorites';
export function useFavorites() {
  const [favorites, setFavorites] = useState([]);
  useEffect(() => {
    const restore = () => { try { const stored = JSON.parse(localStorage.getItem(key) || '[]'); if (Array.isArray(stored)) setFavorites(stored.filter(x => typeof x === 'string')); } catch {} };
    restore(); addEventListener('pageshow', restore); addEventListener('storage', restore);
    return () => { removeEventListener('pageshow', restore); removeEventListener('storage', restore); };
  }, []);
  const toggle = id => setFavorites(previous => { const next = previous.includes(id) ? previous.filter(x => x !== id) : [...previous, id]; try { localStorage.setItem(key, JSON.stringify(next)); } catch {} return next; });
  return [favorites, toggle];
}
export function ProductCard({ product, saved = false, onFavorite, ready = true }) {
  return <article className="catalog-card">
    <div className="catalog-card-image"><a href={productUrl(product)} aria-label={`Открыть: ${product.name}`}><img src={asset(product.images[0])} alt={product.name} loading="lazy" width="600" height="600" /></a>{onFavorite && <button disabled={!ready} className={`favorite-button ${saved ? 'saved' : ''}`} aria-label={`${saved ? 'Убрать из избранного' : 'В избранное'}: ${product.name}`} aria-pressed={saved} onClick={() => onFavorite(product.id)}><Icon name={saved ? 'heart-fill' : 'heart'} size={23} /></button>}</div>
    <div className="catalog-card-meta"><p>{product.brand || 'Подборка ателье'}</p><h3><a href={productUrl(product)}>{product.name}</a></h3><div className="catalog-card-bottom"><span>{product.maxPrice > product.price ? 'от ' : ''}{money(product.price)}</span><a href={productUrl(product)} aria-label={`Подробнее: ${product.name}`}><Icon /></a></div></div>
  </article>;
}
export default function Catalog({ products }) {
  const [filters, setFilters] = useState(emptyFilters);
  const { search, brand, sort, ceiling, onlySaved } = filters;
  const [limit, setLimit] = useState(18);
  const [favorites, toggle] = useFavorites();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const brands = useMemo(() => [...new Set(products.map(p => p.brand).filter(Boolean))].sort(), [products]);
  useEffect(() => {
    const restore = () => { setFilters(readFilters(location.search, brands)); setLimit(18); };
    restore(); setReady(true);
    addEventListener('popstate', restore);
    return () => removeEventListener('popstate', restore);
  }, [brands]);
  useEffect(() => {
    if (!ready) return;
    const query = writeFilters(location.search, filters);
    const url = `${location.pathname}${query ? `?${query}` : ''}${location.hash}`;
    if (`${location.pathname}${location.search}${location.hash}` !== url) history.replaceState(history.state, '', url);
  }, [filters, ready]);
  const filtered = useMemo(() => filterProducts(products, filters, favorites), [products, filters, favorites]);
  const update = (name, value) => { setFilters(p => ({ ...p, [name]: value })); setLimit(18); };
  const reset = () => { setFilters(emptyFilters); setLimit(18); };
  const active = [search.trim() && ['search', `Поиск: ${search.trim()}`, ''], brand && ['brand', brand, ''], ceiling && ['ceiling', `До ${money(ceiling)}`, ''], onlySaved && ['onlySaved', 'Избранное', false]].filter(Boolean);
  const extraCount = Number(Boolean(brand)) + Number(Boolean(ceiling)) + Number(sort !== 'recommended');
  return <div className="catalog-explorer">
    <form className={`catalog-filters ${filtersOpen ? 'filters-expanded' : ''}`} role="search" aria-busy={!ready} aria-label="Поиск и фильтры каталога" onSubmit={e => e.preventDefault()}>
      <label className="search-field"><span>Найти свою модель</span><div><Icon name="magnifying-glass" size={21} /><input disabled={!ready} type="search" aria-label="Поиск по каталогу" placeholder="Название или бренд" value={search} onChange={e => update('search', e.target.value)} /></div></label>
      <button disabled={!ready} className="mobile-filter-toggle" type="button" aria-expanded={filtersOpen} aria-controls="catalog-filter-fields" onClick={() => setFiltersOpen(!filtersOpen)}><span>{filtersOpen ? 'Скрыть фильтры' : 'Фильтры и сортировка'}{extraCount > 0 && <b>{extraCount}</b>}</span><Icon name="caret-right" size={18} /></button>
      <div className="catalog-filter-fields" id="catalog-filter-fields">
        <label><span>Бренд</span><select disabled={!ready} value={brand} onChange={e => update('brand', e.target.value)}><option value="">Все бренды</option>{brands.map(b => <option key={b}>{b}</option>)}</select></label>
        <label><span>Цена из каталога, до ₽</span><input disabled={!ready} type="number" min="0" inputMode="numeric" placeholder="Без ограничения" value={ceiling} onChange={e => update('ceiling', e.target.value)} /></label>
        <label><span>Сортировка</span><select disabled={!ready} value={sort} onChange={e => update('sort', e.target.value)}><option value="recommended">По умолчанию</option><option value="low">Сначала дешевле</option><option value="high">Сначала дороже</option><option value="name">По названию</option></select></label>
        <button className="button button-outline mobile-filter-apply" type="button" onClick={() => setFiltersOpen(false)}>Показать модели ({filtered.length})<Icon /></button>
      </div>
    </form>
    {(active.length > 0 || sort !== 'recommended') && <div className="active-filters" aria-label="Выбранные фильтры">{active.map(([name, text, value]) => <button key={name} disabled={!ready} aria-label={`Убрать фильтр: ${text}`} onClick={() => update(name, value)}>{text}<Icon name="x" size={14} /></button>)}<button className="filter-reset" onClick={reset}>Сбросить всё</button></div>}
    <div className="catalog-status"><p role="status" aria-live="polite">Найдено моделей: <strong>{filtered.length}</strong></p><label className="saved-filter"><input disabled={!ready} type="checkbox" checked={onlySaved} onChange={e => update('onlySaved', e.target.checked)} />Избранное ({favorites.length})</label></div>
    {filtered.length ? <><div className="catalog-grid">{filtered.slice(0, limit).map(p => <ProductCard key={p.id} product={p} ready={ready} saved={favorites.includes(p.id)} onFavorite={toggle} />)}</div>{limit < filtered.length && <div className="load-more"><button className="button button-outline" disabled={!ready} onClick={() => setLimit(n => n + 18)}>Показать ещё {Math.min(18, filtered.length - limit)}<Icon /></button><span>Показано {Math.min(limit, filtered.length)} из {filtered.length}</span></div>}</> : <div className="empty-results"><h2>{onlySaved ? 'Сохраните то, что нравится.' : 'Давайте попробуем иначе.'}</h2><p>{onlySaved ? 'Нажмите на сердце в карточке — модель останется в избранном в этом браузере.' : 'По этим параметрам моделей не найдено. Измените запрос или сбросьте фильтры.'}</p><button className="button button-outline" onClick={reset}>Показать все модели<Icon /></button></div>}
  </div>;
}
