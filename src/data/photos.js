import exteriorPhoto from './exterior-photo.json' with { type: 'json' };
// Real photographs from the client's Alexandrovskaya showroom photoshoot.
export const photos = {
  welcome: { image: 'atelier-welcome', title: 'Личное знакомство', alt: 'Представитель ателье с фирменной эмблемой в салоне', category: 'Семейное ателье' },
  dining: { image: 'dining-room', title: 'Место для тёплых встреч', alt: 'Светлый обеденный стол с реечным основанием и зелёные стулья в салоне', category: 'Столы и стулья' },
  tableDetail: { image: 'table-detail', title: 'Фактура, которую хочется трогать', alt: 'Реечное основание светлого стола и мягкая обивка зелёного стула крупным планом', category: 'Детали мебели' },
  diningWide: { image: 'dining-wide', title: 'Обеденная группа в салоне', alt: 'Обеденная группа с зелёными стульями перед белыми фасадами в шоуруме', category: 'Столы и стулья', landscape: true },
  bathroom: { image: 'bathroom-furniture', title: 'Выразительные сочетания', alt: 'Тёмная тумба с древесными фасадами, раковина и круглое зеркало с подсветкой', category: 'Мебель для ванной' },
  space: { image: 'dining-wide', title: 'Пространство для выбора', alt: 'Обеденный стол и мягкие зелёные стулья в салоне Приоритет на Александровской', category: 'Наш шоурум', landscape: true },
  exterior: exteriorPhoto,
  kitchen: { image: 'wood-kitchen', title: 'Тепло натуральных оттенков', alt: 'Древесные фасады кухни, светлая рабочая поверхность и открытая подсветка в салоне', category: 'Кухня в экспозиции' },
  facades: { image: 'kitchen-facades', title: 'Кухни с характером', alt: 'Кухня с древесными фасадами и светлой столешницей в экспозиции Приоритета', category: 'Кухни' },
  cabinet: { image: 'glass-cabinet', title: 'Продуманное хранение', alt: 'Стеклянная витрина, встроенная техника и детали кухонного хранения', category: 'Хранение' },
  light: { image: 'kitchen-light', title: 'Свет меняет настроение', alt: 'Подвесной светильник, древесные фасады и светлая витрина в экспозиции кухни', category: 'Свет и материалы' },
  materials: { image: 'wood-and-stone', title: 'Дерево и камень', alt: 'Сочетание древесного фасада и светлой каменной рабочей поверхности крупным планом', category: 'Материалы' },
};

export const showroomPhotos = [photos.kitchen, photos.dining, photos.bathroom, photos.cabinet, photos.tableDetail, photos.light, photos.space];
