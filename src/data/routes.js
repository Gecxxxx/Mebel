import { categories, projects, infoPages } from './site.js';
import { services } from './services.js';
import products from './catalog.json';
export const routes = [
  ...Object.entries(services).map(([path, service]) => ({ path, type: 'service', title: service.name, intro: service.intro, service, section: path.startsWith('mebel') ? 'mebel-na-zakaz' : 'kuhni' })),
  { path: 'catalog', type: 'catalog', title: 'Каталог мебели', section: 'catalog' },
  ...categories.map(category => ({ path: `catalog/${category.slug}`, type: 'catalog', title: category.name, intro: category.intro, category, section: 'catalog' })),
  ...products.map(product => ({ path: `catalog/${product.category}/${product.slug}`, type: 'product', title: product.name, intro: `${product.name}${product.brand ? ' ' + product.brand : ''}: характеристики, варианты исполнения и подбор комплектации. Цена и наличие подтверждаются менеджером.`, product, section: 'catalog' })),
  { path: 'projects', type: 'projects', title: 'Наши проекты', section: 'projects' },
  ...projects.map(project => ({ path: `projects/${project.slug}`, type: 'project', title: project.name, intro: project.intro, project, section: 'projects' })),
  ...Object.entries(infoPages).map(([path, page]) => ({ path, type: 'info', title: page.label, intro: page.intro, page, section: path === 'about' ? 'about' : path === 'contacts' ? 'contacts' : '' })),
  { path: 'request', type: 'request', title: 'Обсудить проект', section: '' },
];
