import { categories, projects, infoPages } from './site.js';
import { services } from './services.js';
import products from './products.js';
const publicRoutes = [
  ...Object.entries(services).map(([path, service]) => ({ path, type: 'service', title: service.name, intro: service.intro, service, section: path.startsWith('korpusnaya') ? 'korpusnaya-mebel' : 'kuhni' })),
  { path: 'stoly-i-stulya', type: 'catalog', title: 'Столы и стулья', section: 'stoly-i-stulya' },
  ...categories.map(category => ({ path: `stoly-i-stulya/${category.slug}`, type: 'catalog', title: category.name, intro: category.intro, category, section: 'stoly-i-stulya' })),
  ...products.map(product => ({ path: `stoly-i-stulya/${product.category}/${product.slug}`, type: 'product', title: product.name, intro: `${product.name}${product.brand ? ' ' + product.brand : ''}: характеристики, варианты исполнения и подбор комплектации. Стоимость уточняйте.`, product, section: 'stoly-i-stulya' })),
  { path: 'projects', type: 'projects', title: 'Наши работы', section: 'projects', intro: 'Кухни, шкафы, гардеробные, прихожие и мебель для жилых комнат. Фотографии работ ателье в альбомах по объектам.' },
  ...projects.map(project => ({ path: `projects/${project.slug}`, type: 'project', title: project.name, intro: project.intro, project, section: 'projects' })),
  ...Object.entries(infoPages).map(([path, page]) => ({ path, type: 'info', title: page.label, intro: page.intro, page, section: path === 'about' ? 'about' : path === 'contacts' ? 'contacts' : '' })),
  { path: 'request', type: 'request', title: 'Обсудить проект', section: '' },
];
// Preserve bookmarks and shared links, including their filters.
const legacyRoutes = publicRoutes.filter(r => r.path.startsWith('stoly-i-stulya') || r.path.startsWith('korpusnaya-mebel')).map(r => ({
  path: r.path.replace(/^stoly-i-stulya/, 'catalog').replace(/^korpusnaya-mebel/, 'mebel-na-zakaz'),
  type: 'redirect', title: 'Страница переехала', intro: 'Откройте страницу по новому адресу.', section: r.section, destination: `${r.path}/`,
}));
export const routes = [...publicRoutes, ...legacyRoutes];
