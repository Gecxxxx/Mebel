import { useEffect, useRef, useState } from 'react';
import { href } from '../lib/urls.js';
import { leadApiUrl } from '../data/messengers.js';
import MessengerLinks from './MessengerLinks.jsx';
import Icon from './Icon.jsx';
import { certificateTerms } from '../data/promotions.js';

export default function RequestForm() {
  const [values, setValues] = useState({ name: '', phone: '', kind: 'Кухня', city: 'Елец', comment: '', consent: false });
  const [ready, setReady] = useState(false), [sending, setSending] = useState(false), [errors, setErrors] = useState({}), [result, setResult] = useState(null);
  const [offer, setOffer] = useState('');
  const id = useRef(''), success = useRef(null);
  const kinds = ['Кухня', 'Шкаф или гардеробная', 'Корпусная мебель', 'Детская', 'Спальня', 'Стол и стулья', 'Другая мебель', 'Визит в салон'];
  useEffect(() => { const p = new URLSearchParams(location.search); setValues(v => ({ ...v, kind: kinds.includes(p.get('kind')) ? p.get('kind') : v.kind, comment: (p.get('comment') || '').slice(0, 1500) })); setOffer(['certificate', 'gifts'].includes(p.get('offer')) ? p.get('offer') : ''); id.current = crypto.randomUUID(); setReady(true); }, []);
  useEffect(() => { if (result) success.current?.focus(); }, [result]);
  const update = e => { const { name, value, checked, type } = e.target; setValues(v => ({ ...v, [name]: type === 'checkbox' ? checked : value })); setErrors(p => ({ ...p, [name]: '', general: '' })); };
  const submit = async e => {
    e.preventDefault(); const next = {};
    if (values.name.trim().length < 2) next.name = 'Подскажите, как к вам обращаться.';
    const digits = values.phone.replace(/\D/g, ''); if (digits.length < 10 || digits.length > 15) next.phone = 'Проверьте номер телефона.';
    if (values.city.trim().length < 2) next.city = 'Укажите город.';
    if (!values.consent) next.consent = 'Подтвердите согласие на обработку данных.';
    setErrors(next); if (Object.keys(next).length) { e.currentTarget.elements.namedItem(Object.keys(next)[0])?.focus(); return; }
    setSending(true);
    try {
      const response = await fetch(`${leadApiUrl.replace(/\/$/,'')}/api/leads`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...values, requestId: id.current, source: offer ? `website-${offer}` : 'website-form', project: 'Обсудим при разговоре', timing: 'Уточним при обращении', messenger: 'По телефону', consentVersion: '2026-11-05' }), signal: AbortSignal.timeout(20000) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.accepted) throw new Error(body.error || 'Не удалось отправить обращение. Попробуйте ещё раз.');
      setResult(body);
    } catch (error) { setErrors({ general: error.name === 'TimeoutError' ? 'Не удалось дождаться ответа. Попробуйте ещё раз — повторная заявка не создастся.' : error.message }); }
    finally { setSending(false); }
  };
  if (result) return <div className="request-success" ref={success} tabIndex={-1}><p className="eyebrow">СПАСИБО ЗА ОБРАЩЕНИЕ</p><h2>Заявка принята.</h2><p>{result.delivered ? 'Передали ваши пожелания ателье. Свяжемся по указанному контакту.' : 'Ваше обращение сохранено для ателье. Для разговора прямо сейчас можно написать в мессенджер.'}</p><p>Номер заявки: {result.leadId}</p><MessengerLinks labels /></div>;
  return <form className="inquiry-form full-request-form" onSubmit={submit} noValidate aria-busy={sending}>{offer && <div className="request-offer-context"><strong>{offer === 'certificate' ? 'Заявка на сертификат' : 'Подарок к заказу кухни'}</strong><p>{offer === 'certificate' ? 'Свяжемся с вами, уточним условия и поможем оформить сертификат.' : 'Уточним сумму, комплектацию и подходящий подарок к вашему заказу.'}</p>{offer === 'certificate' && <details><summary>Условия сертификата</summary><ul>{certificateTerms.map(term => <li key={term}>{term}</li>)}</ul></details>}</div>}<div className="form-row">{[['name','Ваше имя','Как к вам обращаться','text','given-name'],['phone','Телефон','+7 (___) ___-__-__','tel','tel']].map(([name,label,placeholder,type,complete]) => <label key={name}>{label}<input disabled={!ready || sending} name={name} value={values[name]} onChange={update} type={type} placeholder={placeholder} autoComplete={complete} maxLength={name === 'phone' ? 30 : 100} aria-required="true" aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `${name}-error` : undefined}/>{errors[name] && <small id={`${name}-error`} className="field-error">{errors[name]}</small>}</label>)}</div><div className="form-row"><label>Какая мебель нужна<select disabled={!ready || sending} name="kind" value={values.kind} onChange={update}>{kinds.map(k => <option key={k}>{k}</option>)}</select></label><label>Ваш город<input disabled={!ready || sending} name="city" value={values.city} onChange={update} autoComplete="address-level2" maxLength={100} aria-invalid={!!errors.city}/>{errors.city && <small className="field-error">{errors.city}</small>}</label></div><label>Пожелания <span className="optional">необязательно</span><textarea disabled={!ready || sending} name="comment" value={values.comment} onChange={update} rows={5} maxLength={1500} placeholder="Размеры, материалы или понравившаяся модель" /></label><label className="quiz-consent request-consent"><input disabled={!ready || sending} name="consent" type="checkbox" checked={values.consent} onChange={update}/><span>Согласен на обработку данных для ответа на заявку. <a href={href('privacy/')} target="_blank" rel="noreferrer">Как используются данные</a></span></label>{errors.consent && <small className="field-error">{errors.consent}</small>}{errors.general && <p className="field-error" role="alert">{errors.general}</p>}<button className="button button-gold form-submit" disabled={!ready || sending} type="submit">{sending ? 'Отправляем…' : 'Отправить заявку'}<Icon /></button></form>;
}
