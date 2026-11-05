import { useEffect, useRef, useState } from 'react';
import { quizQuestions, validateQuizStep } from '../data/quiz.js';
import { leadApiUrl, messengers } from '../data/messengers.js';
import { href } from '../lib/urls.js';
import Icon from './Icon.jsx';

const initial = { kind: '', city: '', project: '', timing: '', name: '', phone: '', messenger: 'Telegram', comment: '', consent: false };
export default function ProjectQuiz() {
  const [values, setValues] = useState(initial);
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [ready, setReady] = useState(false);
  const question = quizQuestions[step];
  const heading = useRef(null);
  const requestId = useRef('');
  const moved = useRef(false);
  useEffect(() => { setReady(true); requestId.current = crypto.randomUUID(); }, []);
  useEffect(() => { if (moved.current) heading.current?.focus({ preventScroll: true }); moved.current = true; }, [step, result]);
  const update = (key, value) => { setValues(v => ({ ...v, [key]: value })); setError(''); };
  const submit = async e => {
    e.preventDefault();
    const problem = validateQuizStep(step, values);
    if (problem) { setError(problem); return; }
    if (step < 4) { setStep(s => s + 1); return; }
    if (!leadApiUrl) { setError('Онлайн-отправка пока подключается. Напишите в Telegram или MAX — поможем с вашим проектом.'); return; }
    setSending(true); setError('');
    try {
      const response = await fetch(`${leadApiUrl.replace(/\/$/, '')}/api/leads`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...values, requestId: requestId.current, source: 'website-quiz', consentVersion: '2026-11-05', website: location.origin }), signal: AbortSignal.timeout(20000) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.accepted) throw new Error(body.error || 'Отправка не завершилась. Попробуйте ещё раз или напишите в мессенджер.');
      setResult(body);
    } catch (e) { setError(e.name === 'TimeoutError' ? 'Не удалось дождаться ответа. Попробуйте ещё раз: повторная заявка не создастся.' : e.message); }
    finally { setSending(false); }
  };
  return <section id="project-quiz" className="project-quiz page-section" aria-labelledby="quiz-title"><div className="quiz-intro"><p className="eyebrow">ДАВАЙТЕ НАЧНЁМ С ВАШЕЙ ИДЕИ</p><h2 id="quiz-title">Ваша мебель начинается с пяти ответов.</h2><p>Расскажите, что хочется создать. Поможем сориентироваться в решениях и обсудим следующий шаг.</p><span className="quiz-time">Около двух минут · без обязательств</span></div><div className="quiz-panel">
    {result ? <div className="quiz-complete"><span className="quiz-complete-mark"><Icon name="check" size={30} /></span><p className="eyebrow">СПАСИБО ЗА ЗНАКОМСТВО</p><h3 ref={heading} tabIndex={-1}>Заявка принята.</h3><p>{result.delivered ? 'Передали ваши ответы ателье. Свяжемся с вами по указанному контакту.' : 'Ваши ответы сохранены для ателье. Если хотите обсудить идею сейчас, напишите нам в мессенджер.'}</p><p className="quiz-reference">Номер заявки: {result.leadId}</p><div className="quiz-messengers">{messengers.filter(m => m.id !== 'whatsapp').map(m => <a className="button button-outline" key={m.id} href={m.url} target="_blank" rel="noreferrer">{m.name}<Icon name={m.icon} /></a>)}</div></div> : <form onSubmit={submit} noValidate aria-busy={sending}><div className="quiz-progress"><span>Вопрос {step + 1} из 5</span><span aria-hidden="true">{String(step + 1).padStart(2, '0')} / 05</span><div role="progressbar" aria-label="Пройдено вопросов" aria-valuenow={step} aria-valuemin={0} aria-valuemax={5}><i style={{ width: `${(step + 1) * 20}%` }} /></div></div><h3 ref={heading} tabIndex={-1}>{question.title}</h3><p className="quiz-hint">{question.hint}</p>
      {question.options ? <fieldset className="quiz-options"><legend className="sr-only">{question.title}</legend>{question.options.map(option => <label key={option} className={values[question.key] === option ? 'selected' : ''}><input disabled={!ready || sending} type="radio" name={question.key} checked={values[question.key] === option} onChange={() => update(question.key, option)} /><span>{option}</span><i aria-hidden="true" /></label>)}</fieldset> : question.key === 'city' ? <label className="quiz-field">Город<input disabled={!ready || sending} name="city" value={values.city} onChange={e => update('city', e.target.value)} placeholder={question.placeholder} autoComplete="address-level2" maxLength={100} /></label> : <div className="quiz-contact"><div className="form-row"><label className="quiz-field">Ваше имя<input disabled={!ready || sending} name="name" value={values.name} onChange={e => update('name', e.target.value)} autoComplete="given-name" maxLength={100} /></label><label className="quiz-field">Телефон<input disabled={!ready || sending} name="phone" type="tel" value={values.phone} onChange={e => update('phone', e.target.value)} autoComplete="tel" placeholder="+7 (___) ___-__-__" maxLength={30} /></label></div><label className="quiz-field">Предпочтительный способ связи<select disabled={!ready || sending} value={values.messenger} onChange={e => update('messenger', e.target.value)}><option>Telegram</option><option>MAX</option><option>По телефону</option></select></label><label className="quiz-consent"><input disabled={!ready || sending} type="checkbox" checked={values.consent} onChange={e => update('consent', e.target.checked)} /><span>Согласен на обработку данных для ответа на мою заявку. <a href={href('privacy/')} target="_blank" rel="noreferrer">Как используются данные</a></span></label></div>}
      {error && <p className="quiz-error" role="alert">{error}</p>}<div className="quiz-actions">{step > 0 && <button className="quiz-back" type="button" disabled={sending} onClick={() => { setStep(s => s - 1); setError(''); }}><Icon name="arrow-left" />Назад</button>}<button className="button button-gold" type="submit" disabled={!ready || sending}>{sending ? 'Отправляем…' : step === 4 ? 'Отправить заявку' : 'Дальше'}<Icon /></button></div>
    </form>}
  </div></section>;
}
