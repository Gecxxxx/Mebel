import { useEffect, useState } from 'react';
import { money, requestUrl } from '../lib/urls.js';
import { useFavorites } from './Catalog.jsx';
import Gallery from './Gallery.jsx';
import Icon from './Icon.jsx';

export default function ProductDetail({ product }) {
  const [selected, setSelected] = useState(Object.fromEntries(product.options.map(o => [o.name, o.values[0]])));
  const [favorites, toggle] = useFavorites();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const edition = product.editions.find(e => product.options.every(o => e.values[o.name] === selected[o.name]));
  const price = product.options.length ? edition?.price : product.price;
  const comment = `Модель: ${product.name}. ${Object.entries(selected).map(([k, v]) => `${k}: ${v}`).join('; ')}`;
  return <div className="product-detail"><Gallery images={product.images} title={product.name} contain /><div className="product-overview"><p className="eyebrow">{product.brand || 'КАТАЛОГ АТЕЛЬЕ'}</p><h1>{product.name}</h1><div className="product-price">{money(price)}</div><p className="price-explanation">Ценовой ориентир из прежнего каталога. Актуальную стоимость, исполнение и наличие подтвердит менеджер.</p>
    {product.options.length > 0 && <div className="product-options">{product.options.map(o => <label key={o.name}>{o.name}<select disabled={!ready} value={selected[o.name]} onChange={e => setSelected(p => ({ ...p, [o.name]: e.target.value }))}>{o.values.map(v => <option key={v}>{v}</option>)}</select></label>)}</div>}
    {product.options.length > 0 && !edition && <p className="combination-note" role="status">Это сочетание нужно уточнить у менеджера. Поможем подобрать подходящее исполнение.</p>}
    <a className="button button-gold" href={requestUrl('Стол и стулья', comment)}>Уточнить и заказать<Icon /></a><button disabled={!ready} className="product-save" aria-pressed={favorites.includes(product.id)} onClick={() => toggle(product.id)}><Icon name={favorites.includes(product.id) ? 'heart-fill' : 'heart'} />{favorites.includes(product.id) ? 'Сохранено в избранном' : 'Сохранить в избранное'}</button>
    <div className="product-assurances"><p>Подбор материалов и вариантов отделки</p><p>Доставка и сборка по согласованным условиям</p><p>Фото показывает один из вариантов исполнения</p></div>
  </div></div>;
}
