import { useEffect, useState } from 'react';
import { business, navigation } from '../data/site.js';
import { href, asset } from '../lib/urls.js';
import Icon from './Icon.jsx';

export default function Header({ current = '' }) {
  const [open, setOpen] = useState(false);
  useEffect(() => { const close = e => { if (e.key === 'Escape') setOpen(false); }; document.addEventListener('keydown', close); return () => document.removeEventListener('keydown', close); }, []);
  const active = path => current.startsWith(path.replace(/\/$/, ''));
  return <header className="site-header" id="top">
    <a className="brand" href={href()} aria-label="Приоритет — на главную"><img className="brand-crest" src={asset('brand-crest.jpg')} alt="" /><span className="brand-type">ПРИОРИТЕТ<small>АТЕЛЬЕ МЕБЕЛИ</small></span></a>
    <nav className="desktop-nav" aria-label="Основная навигация">{navigation.map(([name, path]) => <a key={path} href={href(path)} aria-current={active(path) ? 'page' : undefined}>{name}</a>)}</nav>
    <a className="header-phone" aria-label={`Позвонить ${business.phone}`} href={`tel:${business.tel}`}><Icon name="phone" size={22} /><span>{business.phone}</span></a>
    <button className="icon-button menu-toggle" aria-label={open ? 'Закрыть меню' : 'Открыть меню'} aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(!open)}><Icon name={open ? 'x' : 'list'} size={28} /></button>
    {open && <nav className="mobile-nav" id="mobile-menu" aria-label="Мобильная навигация">{navigation.map(([name, path]) => <a key={path} href={href(path)} onClick={() => setOpen(false)} aria-current={active(path) ? 'page' : undefined}>{name}<Icon name="caret-right" size={18} /></a>)}<a className="button button-gold" href={href('request/')}>Обсудить проект<Icon /></a><a className="mobile-phone" href={`tel:${business.tel}`}>{business.phone}</a></nav>}
  </header>;
}
