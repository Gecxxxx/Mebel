import { useEffect, useRef, useState } from 'react';
import { asset } from '../lib/urls.js';
import Icon from './Icon.jsx';

export default function Gallery({ images, title, contain = false }) {
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [ready, setReady] = useState(false);
  const dialog = useRef(null);
  const touch = useRef(null);
  const swiped = useRef(false);
  const move = delta => setIndex(i => (i + delta + images.length) % images.length);
  useEffect(() => setReady(true), []);
  useEffect(() => {
    const modal = dialog.current;
    if (expanded && !modal.open) modal.showModal();
    if (!expanded && modal.open) modal.close();
  }, [expanded]);
  const startSwipe = e => { swiped.current = false; touch.current = [e.changedTouches[0].clientX, e.changedTouches[0].clientY]; };
  const endSwipe = e => {
    if (!touch.current) return;
    const dx = e.changedTouches[0].clientX - touch.current[0];
    const dy = e.changedTouches[0].clientY - touch.current[1];
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) { swiped.current = true; move(dx < 0 ? 1 : -1); }
    touch.current = null;
  };
  const controls = <div className="gallery-controls"><button disabled={!ready} className="icon-button" aria-label="Предыдущее фото" onClick={() => move(-1)}><Icon name="arrow-left" /></button><span aria-live="polite">{String(index + 1).padStart(2, '0')} <span>/</span> {String(images.length).padStart(2, '0')}</span><button disabled={!ready} className="icon-button" aria-label="Следующее фото" onClick={() => move(1)}><Icon /></button></div>;
  return <div className={`photo-gallery ${contain ? 'product-gallery' : ''}`}>
    <div className="gallery-stage" onTouchStart={startSwipe} onTouchEnd={endSwipe}>
      <button className="gallery-open" disabled={!ready} aria-label={`Увеличить фото: ${title}`} onClick={() => { if (!swiped.current) setExpanded(true); swiped.current = false; }}>
        <img key={images[index]} src={asset(images[index])} alt={`${title} — фото ${index + 1}`} fetchPriority="high" width="900" height="900" />
        <span className="gallery-zoom"><Icon name="magnifying-glass" size={19} /><span>Увеличить</span></span>
      </button>
    </div>
    {images.length > 1 && <>{controls}<div className="gallery-thumbs" aria-label="Выбор фотографии">{images.map((image, i) => <button disabled={!ready} key={image} className={i === index ? 'selected' : ''} aria-label={`Показать фото ${i + 1}`} aria-pressed={i === index} onClick={() => setIndex(i)}><img src={asset(image)} alt="" loading="lazy" width="80" height="80" /></button>)}</div></>}
    <dialog ref={dialog} className="gallery-lightbox" aria-label={`Фотографии: ${title}`} onCancel={() => setExpanded(false)} onClose={() => setExpanded(false)} onClick={e => { if (e.target === e.currentTarget) setExpanded(false); }} onKeyDown={e => { if (e.key === 'ArrowRight') { e.preventDefault(); move(1); } if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1); } }}>
      <div className="lightbox-header"><p>{title}</p><button className="icon-button" aria-label="Закрыть просмотр" onClick={() => setExpanded(false)}><Icon name="x" size={26} /></button></div>
      <div className={`lightbox-image ${contain ? 'lightbox-product' : ''}`} onTouchStart={startSwipe} onTouchEnd={endSwipe}><img key={images[index]} src={expanded ? asset(images[index]) : undefined} alt={`${title} — фото ${index + 1}`} /></div>
      {images.length > 1 && controls}
    </dialog>
  </div>;
}
