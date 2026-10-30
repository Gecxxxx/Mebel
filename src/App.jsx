import { useEffect, useRef, useState } from 'react';
import './prototype.css';

const A = `${import.meta.env.BASE_URL}assets/`;
const PHONE = '+7 (961) 606-93-09';
const Icon = ({ name = 'arrow-right', size = 20, className = '' }) => <img className={`icon ${className}`} src={`${A}icons/${name}.svg`} width={size} height={size} alt="" aria-hidden="true" />;
const Brand = ({ onClick }) => <a className="brand" href="#top" onClick={onClick} aria-label="Приоритет — на главную"><img className="brand-crest" src={`${A}brand-crest.jpg`} alt="" /><span className="brand-type">ПРИОРИТЕТ<small>АТЕЛЬЕ МЕБЕЛИ</small></span></a>;

const projects = {
  staircase: {
    title: 'Место для всего. Даже под лестницей.', short: 'Шкаф под лестницей', category: 'Мебель на заказ',
    images: ['staircase-overall.jpg', 'staircase-detail.jpg', 'staircase-drawers.jpg'],
    description: 'Система хранения, которая повторяет геометрию лестницы и использует доступное пространство. Вместительные секции и выдвижные ящики объединены реечными фасадами.',
    details: [['Корпус', 'ЛДСП «Бук Лайт»'], ['Фасады', 'Домини AL-13, реечная фрезеровка'], ['Решение', 'Шкаф и выдвижные ящики по размерам помещения']],
    kind: 'Шкаф или гардеробная', cta: 'Обсудить похожий проект',
  },
  dining: {
    title: 'Для уютных ужинов и тёплых встреч.', short: 'Обеденная группа', category: 'Мебель в шоуруме',
    images: ['dining.webp', 'dining-detail.webp'],
    description: 'Стол с выразительным рельефным основанием и мягкие стулья в спокойных оттенках. Посмотрите мебель вживую, попробуйте посадку и подберите сочетание для своего интерьера.',
    details: [['Где посмотреть', 'Елец, Александровская, 1/1'], ['Как выбрать', 'Сравнить материалы и варианты отделки в салоне'], ['Цена и наличие', 'Уточняются для выбранной комплектации']],
    kind: 'Стол и стулья', cta: 'Подобрать стол и стулья',
  },
};

function Overlay({ title, onClose, className = '', children }) {
  const panel = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const oldFocus = document.activeElement;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') closeRef.current();
      if (e.key !== 'Tab') return;
      const nodes = Array.from(panel.current.querySelectorAll('a[href],button:not([disabled]),input,textarea,select')).filter(n => n.offsetParent !== null);
      if (!nodes.length) return;
      if (e.shiftKey && (document.activeElement === nodes[0] || document.activeElement === panel.current)) { e.preventDefault(); nodes.at(-1).focus(); }
      if (!e.shiftKey && document.activeElement === nodes.at(-1)) { e.preventDefault(); nodes[0].focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = oldOverflow; document.removeEventListener('keydown', onKey); oldFocus?.focus(); };
  }, []);
  return <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}><section role="dialog" aria-modal="true" aria-label={title} className={`dialog ${className}`} tabIndex={-1} ref={panel}><button className="icon-button dialog-close" aria-label="Закрыть окно" onClick={onClose}><Icon name="x" size={25} /></button>{children}</section></div>;
}

function Inquiry({ initialKind, onClose }) {
  const [values, setValues] = useState({ name: '', phone: '', kind: initialKind, city: 'Елец', comment: '' });
  const [errors, setErrors] = useState({});
  const [prepared, setPrepared] = useState(false);
  const [copied, setCopied] = useState(false);
  const update = e => { const { name, value } = e.target; setValues(v => ({ ...v, [name]: value })); setErrors(x => ({ ...x, [name]: '' })); };
  const message = `Здравствуйте! Хочу обсудить проект мебели.\nИмя: ${values.name}\nТелефон: ${values.phone}\nМебель: ${values.kind}\nГород: ${values.city || 'Уточним при общении'}${values.comment ? `\nПожелания: ${values.comment}` : ''}`;
  const submit = e => {
    e.preventDefault(); const next = {};
    if (values.name.trim().length < 2) next.name = 'Подскажите, как к вам обращаться.';
    const length = values.phone.replace(/\D/g, '').length;
    if (length < 10 || length > 15) next.phone = 'Проверьте номер: укажите не менее 10 цифр.';
    setErrors(next); if (!Object.keys(next).length) setPrepared(true); else e.currentTarget.elements.namedItem(Object.keys(next)[0])?.focus();
  };
  const copy = async () => { try { await navigator.clipboard.writeText(message); setCopied(true); } catch { setCopied(false); } };
  return <Overlay title="Обсудить проект" onClose={onClose} className="inquiry-dialog"><p className="eyebrow">НАЧНЁМ СО ЗНАКОМСТВА</p>
    {!prepared ? <><h2>Каким вы видите<br />свой дом?</h2><p className="dialog-intro">Расскажите немного о вашей задаче. Подготовим детали, которые вы сможете передать нам в Telegram.</p>
      <form className="inquiry-form" onSubmit={submit} noValidate>
        <div className="form-row"><label>Ваше имя<input name="name" aria-label="Ваше имя" aria-required="true" value={values.name} onChange={update} autoComplete="given-name" placeholder="Как к вам обращаться" aria-invalid={!!errors.name} aria-describedby={errors.name ? 'name-error' : undefined} />{errors.name && <small className="field-error" id="name-error">{errors.name}</small>}</label><label>Телефон<input name="phone" aria-label="Телефон" aria-required="true" value={values.phone} onChange={update} type="tel" inputMode="tel" autoComplete="tel" placeholder="+7 (___) ___-__-__" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? 'phone-error' : undefined} />{errors.phone && <small className="field-error" id="phone-error">{errors.phone}</small>}</label></div>
        <div className="form-row"><label>Какая мебель нужна<select name="kind" value={values.kind} onChange={update}><option>Кухня</option><option>Шкаф или гардеробная</option><option>Стол и стулья</option><option>Другая мебель</option></select></label><label>Ваш город<input name="city" value={values.city} onChange={update} autoComplete="address-level2" placeholder="Елец или другой город" /></label></div>
        <label>Пожелания <span className="optional">необязательно</span><textarea name="comment" value={values.comment} onChange={update} rows={3} placeholder="Размеры, материалы или то, что для вас особенно важно" /></label>
        <button className="button button-gold form-submit" type="submit">Подготовить обращение<Icon /></button><p className="form-note">Предпочитаете поговорить? <a href="tel:+79616069309">{PHONE}</a></p>
      </form></> : <div className="inquiry-success" aria-live="polite"><h2>Давайте обсудим<br />вашу идею.</h2><p className="dialog-intro">Обращение подготовлено. Скопируйте детали и отправьте их нам в Telegram — или позвоните, если так удобнее.</p><div className="message-preview">{message}</div><div className="success-actions"><button className="button button-gold" onClick={copy}><Icon name={copied ? 'check' : 'copy'} />{copied ? 'Детали скопированы' : 'Скопировать обращение'}</button><a className="button button-outline" href="https://t.me/prioritet_mebel" target="_blank" rel="noreferrer">Открыть Telegram<Icon name="paper-plane-tilt" /></a></div><button className="text-link edit-link" onClick={() => setPrepared(false)}><Icon name="arrow-left" size={18} />Изменить детали</button><p className="form-note">Или позвоните нам: <a href="tel:+79616069309">{PHONE}</a></p></div>}
  </Overlay>;
}

function Project({ id, onClose, onDiscuss }) {
  const data = projects[id]; const [index, setIndex] = useState(0);
  return <Overlay title={data.short} onClose={onClose} className="project-dialog"><div className="project-gallery"><img className="project-main-image" src={A + data.images[index]} alt={`${data.short} — фото ${index + 1}`} /><div className="gallery-controls"><button className="icon-button" aria-label="Предыдущее фото" onClick={() => setIndex(n => (n + data.images.length - 1) % data.images.length)}><Icon name="arrow-left" /></button><span>{String(index + 1).padStart(2, '0')} / {String(data.images.length).padStart(2, '0')}</span><button className="icon-button" aria-label="Следующее фото" onClick={() => setIndex(n => (n + 1) % data.images.length)}><Icon /></button></div></div><div className="project-information"><p className="eyebrow">{data.category}</p><h2>{data.title}</h2><p>{data.description}</p><dl>{data.details.map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl><button className="button button-gold" onClick={() => onDiscuss(data.kind)}>{data.cta}<Icon /></button></div></Overlay>;
}

function Showrooms({ onClose, onDiscuss }) {
  const places = [{ address: 'Александровская, 1/1', phone: '+7 (905) 681-90-67', tel: '+79056819067', hours: ['Пн–Пт: 10:00–18:00', 'Сб: 10:00–16:00', 'Вс: выходной'] }, { address: 'Королева, 1', phone: PHONE, tel: '+79616069309', hours: ['Пн–Пт: 10:00–18:00', 'Сб–Вс: 10:00–16:00'] }];
  return <Overlay title="Посетить шоурум" onClose={onClose} className="showroom-dialog"><div className="showroom-dialog-heading"><p className="eyebrow">БУДЕМ РАДЫ ВСТРЕЧЕ</p><h2>Мебель нужно<br />почувствовать.</h2><p>Посмотрите оттенки при дневном свете, прикоснитесь к материалам и расскажите нам о своём доме.</p></div><img className="showroom-exterior" src={A + 'showroom-exterior.jpg'} alt="Вход в салон мебели Приоритет" /><div className="showroom-locations">{places.map(p => <article className="location" key={p.address}><h3><Icon name="map-pin" size={22} />Елец, {p.address}</h3><div className="location-hours">{p.hours.map(h => <p key={h}>{h}</p>)}</div><a className="location-phone" href={`tel:${p.tel}`}>{p.phone}</a><a className="text-link" target="_blank" rel="noreferrer" href={`https://yandex.ru/maps/?text=${encodeURIComponent('Елец ' + p.address)}`}>Построить маршрут<Icon size={18} /></a></article>)}</div><button className="button button-gold" onClick={() => onDiscuss('Кухня')}>Обсудить визит<Icon /></button></Overlay>;
}

export function App() {
  const [menu, setMenu] = useState(false); const [overlay, setOverlay] = useState(null); const [kind, setKind] = useState('Кухня');
  const close = () => setOverlay(null);
  const discuss = (selected = 'Кухня') => { setKind(selected); setOverlay('inquiry'); setMenu(false); };
  useEffect(() => { const key = e => { if (e.key === 'Escape') setMenu(false); }; document.addEventListener('keydown', key); return () => document.removeEventListener('keydown', key); }, []);
  return <><a className="skip-link" href="#content">К содержимому</a><header className="site-header" id="top"><Brand onClick={() => setMenu(false)} /><nav className="desktop-nav" aria-label="Основная навигация"><a href="#kitchens">Кухни</a><a href="#projects">Мебель на заказ</a><a href="#projects">Проекты</a><a href="#showroom">Шоурум</a></nav><a className="header-phone" aria-label={"Позвонить " + PHONE} href="tel:+79616069309"><Icon name="phone" size={22} /><span>{PHONE}</span></a><button className="icon-button menu-toggle" aria-label={menu ? 'Закрыть меню' : 'Открыть меню'} aria-expanded={menu} aria-controls="mobile-menu" onClick={() => setMenu(!menu)}><Icon name={menu ? 'x' : 'list'} size={28} /></button>{menu && <nav className="mobile-nav" id="mobile-menu" aria-label="Мобильная навигация">{[['Кухни', 'kitchens'], ['Мебель на заказ', 'projects'], ['Наши проекты', 'projects'], ['Шоурум', 'showroom']].map(([label, target]) => <a href={`#${target}`} key={label} onClick={() => setMenu(false)}>{label}<Icon name="caret-right" size={18} /></a>)}<button className="button button-gold" onClick={() => discuss()}>Обсудить проект<Icon /></button><a className="mobile-phone" href="tel:+79616069309">{PHONE}</a></nav>}</header>
    <main id="content"><section className="hero" id="kitchens" aria-labelledby="hero-title"><div className="hero-copy"><p className="eyebrow">СЕМЕЙНОЕ АТЕЛЬЕ МЕБЕЛИ · ЕЛЕЦ</p><h1 id="hero-title">Мебель, которая<br />становится частью<br />дома</h1><p className="hero-description">Подберём кухню и мебель под ваш интерьер.<br className="desktop-break" /> Сопроводим от замера до установки.</p><div className="hero-actions"><button className="button button-gold" onClick={() => discuss()}>Обсудить проект</button><a className="text-link" href="#projects">Смотреть проекты<Icon /></a></div></div><div className="hero-image"><img src={A + 'kitchen.webp'} alt="Кухня из дерева и камня в салоне мебели Приоритет" fetchPriority="high" /></div></section>
      <section className="service-strip" aria-label="Сопровождение вашего проекта"><div><h2>Индивидуальный проект</h2><p>Учитываем пространство,<br />ваши привычки и стиль жизни.</p></div><div><h2>Подбор материалов</h2><p>Помогаем выбрать надёжные<br />и практичные решения.</p></div><div><h2>Сборка и установка</h2><p>Координируем все этапы<br />с проверенными партнёрами.</p></div></section>
      <section className="projects-section" id="projects" aria-labelledby="projects-title"><div className="projects-heading"><div><p className="eyebrow">НАШИ ПРОЕКТЫ</p><h2 id="projects-title">Продумано для жизни</h2></div><p>Кухни, шкафы и другая мебель,<br />которая помогает создать уютный<br className="wide-break" /> и удобный дом.</p></div><div className="projects-grid"><article className="project-card staircase-card"><button className="project-image-button" aria-label="Посмотреть проект шкафа под лестницей" onClick={() => setOverlay('staircase')}><img src={A + 'staircase-overall.jpg'} alt="Встроенный шкаф с реечными фасадами под лестницей" loading="lazy" /><span className="image-action"><Icon size={24} /></span></button><div className="project-caption"><button className="project-title" onClick={() => setOverlay('staircase')}>Шкаф под лестницей</button><span className="caption-rule" /><p>Рационально используем пространство<br />и сохраняем единый стиль интерьера.</p></div></article><article className="project-card dining-card"><button className="project-image-button" aria-label="Посмотреть обеденную группу в шоуруме" onClick={() => setOverlay('dining')}><img src={A + 'dining.webp'} alt="Светлый стол и мягкие зелёные стулья в шоуруме" loading="lazy" /><span className="image-action"><Icon size={24} /></span></button><div className="project-caption"><button className="project-title" onClick={() => setOverlay('dining')}>Обеденная группа в шоуруме</button><div className="dining-caption-detail"><span className="caption-rule" /><p>Столы и стулья для уютных семейных<br />ужинов и тёплых встреч.</p></div></div></article></div></section>
      <section className="showroom-section" id="showroom" aria-labelledby="showroom-title"><div className="showroom-image"><img src={A + 'materials-illustration.png'} alt="Иллюстрация сочетаний дерева, материалов и мягкой обивки" loading="lazy" /><span className="illustration-label">Иллюстрация материалов</span></div><div className="showroom-copy"><p className="eyebrow">НАШ ШОУРУМ</p><h2 id="showroom-title">Приходите знакомиться<br />с материалами</h2><p className="showroom-address"><Icon name="map-pin" size={25} />Елец, Александровская, 1/1</p><button className="text-link" onClick={() => setOverlay('showroom')}>Посетить шоурум<Icon size={22} /></button></div></section>
    </main><footer className="site-footer"><span>© 2026 Ателье мебели «Приоритет»</span><span>С любовью к вам и своему делу</span><button className="text-link" onClick={() => setOverlay('showroom')}>Адреса и контакты<Icon size={18} /></button></footer>
    {overlay === 'inquiry' && <Inquiry initialKind={kind} onClose={close} />}{(overlay === 'staircase' || overlay === 'dining') && <Project key={overlay} id={overlay} onClose={close} onDiscuss={discuss} />}{overlay === 'showroom' && <Showrooms onClose={close} onDiscuss={discuss} />}
  </>;
}
