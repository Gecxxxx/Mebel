import { asset, requestUrl } from '../lib/urls.js';
import { publicGateway } from '../lib/public-gateway.js';

export const marketing = {
  catalog: asset('marketing/prioritet-projects-2026.pdf'),
  cover: asset('marketing/catalog-cover.webp'),
  certificate: asset('marketing/certificate.webp'),
  video: `${publicGateway}/media/atelier-introduction.mp4`,
  poster: asset('marketing/atelier-poster.webp'),
};
export const certificateTerms = [
  '10% стоимости мебели или 15% комплексного заказа, максимум 100 000 ₽.',
  'Комплексный заказ — два и более предмета мебели в одном договоре.',
  'Срок действия — три месяца с даты вручения. Сертификат можно передать близким.',
  'Сертификат действует вместо подарков. Условия и выдачу согласуем при обращении.',
];
export const gifts = [
  { title: 'Мойка в подарок', threshold: 'При заказе от 160 000 ₽' },
  { title: 'Вытяжка в подарок', threshold: 'При заказе от 300 000 ₽' },
];
export const offerRequestUrl = (offer = 'certificate') => `${requestUrl('Кухня', offer === 'gifts' ? 'Интересуют подарки к заказу кухни. Помогите уточнить условия.' : 'Хочу получить сертификат на покупку мебели. Помогите уточнить условия.')}&offer=${offer === 'gifts' ? 'gifts' : 'certificate'}`;
export const projectExamples = [
  { id: 'corner', category: 'kuhni', title: 'Угловая кухня', price: 160000, width: 937, height: 1086, material: 'Плёнка ПВХ на PUR-клее, фурнитура BOYARD', kind: 'Кухня' },
  { id: 'green', category: 'kuhni', title: 'Зелёная кухня', price: 385600, width: 960, height: 1113, material: 'Фасады ПВХ на PUR-клее, петли с доводчиками', kind: 'Кухня' },
  { id: 'island', category: 'kuhni', title: 'Кухня с островом', price: 1200000, width: 960, height: 1113, material: 'Эмаль и акриловый камень STARON', kind: 'Кухня' },
  { id: 'wardrobe', category: 'korpusnaya-mebel', title: 'Шкаф с рифлёными фасадами', price: 177000, width: 960, height: 1113, material: 'Закрытое хранение и открытая ниша с древесной фактурой', kind: 'Шкаф или гардеробная' },
];
