import { clientWorks } from './works.js';
import { photos } from './photos.js';
import materialPhoto from './material-photo.json' with { type: 'json' };

export const workBySlug = slug => clientWorks.find(p => p.slug === slug);
export const carouselPhoto = work => ({ ...work.cover, title: work.name, category: work.type });
export const homeInspiration = ['kuhnya-teplye-ottenki', 'kuhnya-s-vitrinoy', 'prihozhaya-s-zerkalom', 'gostinaya-s-tv-zonoy', 'shkaf-s-otkrytymi-polkami', 'kuhnya-spokoynaya-klassika'].map(slug => carouselPhoto(workBySlug(slug)));
export const processPhotos = [photos.facades, materialPhoto, photos.welcome];
export const homeShowroomPhotos = [photos.bathroom, photos.light, photos.cabinet, photos.kitchen];
export const furnitureTiles = [
  { title: 'Шкафы', text: 'Встроенные, распашные и купе', work: 'uglovoy-shkaf', link: 'korpusnaya-mebel/shkafy/' },
  { title: 'Гардеробные', text: 'Удобный порядок для ваших вещей', work: 'garderobnaya-s-podsvetkoy', link: 'korpusnaya-mebel/garderobnye/' },
  { title: 'Прихожие', text: 'Хранение и место для переобувания', work: 'prihozhaya-s-zerkalom', link: 'projects/?category=prihozhie' },
  { title: 'Гостиные', text: 'ТВ-зоны, тумбы и стеллажи', work: 'gostinaya-s-tv-zonoy', link: 'projects/?category=zhilye-komnaty' },
  { title: 'Детские', text: 'Рабочие места и системы хранения', work: 'komnata-s-rabochey-zonoy', link: 'request/?kind=Детская' },
  { title: 'Спальни', text: 'Мебель и хранение под ваш интерьер', work: 'garderobnaya-za-peregorodkoy', link: 'request/?kind=Спальня' },
  { title: 'Встроенные решения', text: 'Для ниш и сложной геометрии', work: 'shkaf-s-otkrytymi-polkami', link: 'projects/shkaf-pod-lestnicey/' },
];
