export const quizQuestions = [
  { key: 'kind', title: 'Какая мебель вам нужна?', hint: 'Начнём с того, что хочется изменить дома.', options: ['Кухня', 'Шкаф', 'Гардеробная', 'Мебель для детской', 'Мебель для спальни', 'Столы и стулья', 'Другая корпусная мебель'] },
  { key: 'city', title: 'В каком городе ваш дом?', hint: 'Город или населённый пункт — чтобы обсудить замер и доставку.', placeholder: 'Например, Елец' },
  { key: 'project', title: 'Что уже есть для проекта?', hint: 'Можно обратиться и с готовым планом, и с первой идеей.', options: ['Есть размеры или план', 'Есть дизайн-проект', 'Нужен замер', 'Пока выбираю идеи'] },
  { key: 'timing', title: 'Когда планируете заказать мебель?', hint: 'Подстроим разговор под ваши планы.', options: ['В ближайший месяц', 'Через 1–3 месяца', 'Позже', 'Хочу сначала посоветоваться'] },
  { key: 'contact', title: 'Как с вами связаться?', hint: 'Оставьте контакт для разговора о вашей мебели.' },
];

export function validateQuizStep(step, values) {
  const q = quizQuestions[step];
  if (q.key === 'contact') {
    if ((values.name || '').trim().length < 2) return 'Подскажите, как к вам обращаться.';
    const digits = (values.phone || '').replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) return 'Проверьте номер телефона.';
    if (!values.consent) return 'Для отправки заявки нужно согласие на обработку данных.';
    return '';
  }
  if (q.options && !q.options.includes(values[q.key])) return 'Выберите подходящий вариант.';
  if (!q.options && (values[q.key] || '').trim().length < 2) return 'Укажите город или населённый пункт.';
  return '';
}
