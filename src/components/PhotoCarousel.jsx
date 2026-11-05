import { useEffect, useRef, useState } from 'react';
import { photoSrc, photoSrcSet } from '../lib/urls.js';
import Icon from './Icon.jsx';

export default function PhotoCarousel({ photos, label = 'Фотографии салона', inset = false }) {
  const rail = useRef(null);
  const dialog = useRef(null);
  const frame = useRef(0);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState({ first: 1, last: 1, atStart: true, atEnd: false });
  const [opened, setOpened] = useState(false);
  const [index, setIndex] = useState(0);
  const selected = photos[index];
  const refresh = () => {
    const list = rail.current;
    if (!list) return;
    const box = list.getBoundingClientRect();
    const visible = Array.from(list.children).map((item, i) => {
      const r = item.getBoundingClientRect();
      const overlap = Math.min(box.right, r.right) - Math.max(box.left, r.left);
      return overlap >= r.width * .5 ? i + 1 : null;
    }).filter(Boolean);
    setView({ first: visible[0] || 1, last: visible.at(-1) || 1, atStart: list.scrollLeft < 3, atEnd: list.scrollLeft >= list.scrollWidth - list.clientWidth - 3 });
  };
  const scheduleRefresh = () => { cancelAnimationFrame(frame.current); frame.current = requestAnimationFrame(refresh); };
  useEffect(() => {
    setReady(true); refresh();
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(scheduleRefresh) : null;
    observer?.observe(rail.current);
    window.addEventListener('resize', scheduleRefresh);
    return () => { observer?.disconnect(); window.removeEventListener('resize', scheduleRefresh); cancelAnimationFrame(frame.current); };
  }, []);
  useEffect(() => {
    if (opened && !dialog.current.open) dialog.current.showModal();
    if (!opened && dialog.current.open) dialog.current.close();
  }, [opened]);
  const step = direction => {
    const list = rail.current;
    const distance = list.children[0].getBoundingClientRect().width + parseFloat(getComputedStyle(list).gap || '0');
    list.scrollBy({ left: direction * distance, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  const changePhoto = direction => setIndex(i => (i + direction + photos.length) % photos.length);
  return <div className={`photo-carousel ${inset ? 'photo-carousel--inset' : ''}`} role="region" aria-label={label} aria-roledescription="карусель">
    <div className="photo-carousel-top"><p><Icon name="arrow-left" size={18} />Листайте фотографии<Icon size={18} /></p><div><button disabled={!ready || view.atStart} className="icon-button" aria-label="Предыдущие фотографии" onClick={() => step(-1)}><Icon name="arrow-left" size={24} /></button><button disabled={!ready || view.atEnd} className="icon-button" aria-label="Следующие фотографии" onClick={() => step(1)}><Icon size={24} /></button></div></div>
    <ol ref={rail} className="photo-rail" tabIndex={0} aria-label="Фотографии — используйте стрелки влево и вправо" onScroll={scheduleRefresh} onKeyDown={e => {
      if (e.target !== e.currentTarget) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); step(e.key === 'ArrowRight' ? 1 : -1); }
      if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault();
        rail.current.scrollTo({ left: e.key === 'Home' ? 0 : rail.current.scrollWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      }
    }}>
      {photos.map((photo, i) => <li key={photo.image}><figure>
        <button disabled={!ready} className="photo-rail-open" aria-label={`Увеличить фото: ${photo.title}`} onClick={() => { setIndex(i); setOpened(true); }}>
          <img src={photoSrc(photo)} srcSet={photoSrcSet(photo)} sizes="(max-width: 600px) 76vw, (max-width: 900px) 38vw, 28vw" alt={photo.alt} width={photo.width || 960} height={photo.height || (photo.landscape ? 640 : 1440)} loading="lazy" decoding="async" />
          <span className="photo-rail-zoom"><Icon name="magnifying-glass" size={20} /></span>
        </button>
        <figcaption><span>{photo.category}</span><h3>{photo.title}</h3></figcaption>
      </figure></li>)}
    </ol>
    <div className="photo-carousel-controls"><p>Листайте и рассматривайте детали</p><span className="photo-carousel-count" role="status" aria-live="polite" aria-label={`Фотографии ${view.first}${view.last !== view.first ? `–${view.last}` : ''} из ${photos.length}`}>{String(view.first).padStart(2, '0')}{view.last !== view.first && `—${String(view.last).padStart(2, '0')}`}<span> / {String(photos.length).padStart(2, '0')}</span></span><div><button disabled={!ready || view.atStart} className="icon-button" aria-label="Листать фотографии назад" onClick={() => step(-1)}><Icon name="arrow-left" /></button><button disabled={!ready || view.atEnd} className="icon-button" aria-label="Листать фотографии вперёд" onClick={() => step(1)}><Icon /></button></div></div>
    <dialog ref={dialog} className="gallery-lightbox photo-carousel-dialog" aria-label={label} onCancel={() => setOpened(false)} onClose={() => setOpened(false)} onClick={e => { if (e.target === e.currentTarget) setOpened(false); }} onKeyDown={e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); changePhoto(e.key === 'ArrowRight' ? 1 : -1); }
    }}>
      <div className="lightbox-header"><p>{selected.title}<small>{selected.category}</small></p><button className="icon-button" aria-label="Закрыть фотографии" onClick={() => setOpened(false)}><Icon name="x" size={26} /></button></div>
      <div className="lightbox-image"><img key={selected.image} src={opened ? photoSrc(selected, 1600) : undefined} alt={selected.alt} width="1600" height={selected.landscape ? 1067 : 2400} /></div>
      <div className="gallery-controls"><button className="icon-button" aria-label="Предыдущий снимок" onClick={() => changePhoto(-1)}><Icon name="arrow-left" /></button><span aria-live="polite">{String(index + 1).padStart(2, '0')} <span>/</span> {String(photos.length).padStart(2, '0')}</span><button className="icon-button" aria-label="Следующий снимок" onClick={() => changePhoto(1)}><Icon /></button></div>
    </dialog>
  </div>;
}
