import { useState } from 'react';
import { asset } from '../lib/urls.js';
import Icon from './Icon.jsx';

export default function Gallery({ images, title, contain = false }) {
  const [index, setIndex] = useState(0);
  return <div className={`photo-gallery ${contain ? 'product-gallery' : ''}`}>
    <div className="gallery-stage"><img src={asset(images[index])} alt={`${title} — фото ${index + 1}`} fetchPriority="high" /></div>
    {images.length > 1 && <><div className="gallery-controls"><button className="icon-button" aria-label="Предыдущее фото" onClick={() => setIndex(i => (i + images.length - 1) % images.length)}><Icon name="arrow-left" /></button><span aria-live="polite">{String(index + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}</span><button className="icon-button" aria-label="Следующее фото" onClick={() => setIndex(i => (i + 1) % images.length)}><Icon /></button></div><div className="gallery-thumbs">{images.map((image, i) => <button key={image} className={i === index ? 'selected' : ''} aria-label={`Показать фото ${i + 1}`} aria-pressed={i === index} onClick={() => setIndex(i)}><img src={asset(image)} alt="" loading="lazy" /></button>)}</div></>}
  </div>;
}
