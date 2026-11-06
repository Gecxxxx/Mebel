import { useEffect, useRef, useState } from 'react';
import { certificateTerms, gifts, marketing, offerRequestUrl } from '../data/promotions.js';
import { PROMOTION_DELAY, readPromotionState, savePromotionState, canAutoOpenPromotion } from '../lib/promotion-state.js';
import Icon from './Icon.jsx';

export default function PromotionPopup() {
  const dialog = useRef(null), show = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let storage;
    try { storage = window.sessionStorage; } catch { /* Optional preference storage. */ }
    const state = readPromotionState(storage);
    let lastTick = performance.now(), interval;
    const blocked = () => !!document.querySelector('dialog[open], .site-header [aria-expanded="true"]') || !!document.activeElement?.closest('form') || [...document.querySelectorAll('video')].some(video => !video.paused && !video.ended);
    const open = () => {
      if (!dialog.current || dialog.current.open) return;
      state.shown = true;
      savePromotionState(storage, state);
      clearInterval(interval);
      dialog.current.showModal();
      document.documentElement.classList.add('promotion-is-open');
      setIsOpen(true);
    };
    show.current = open;
    const onTrigger = event => {
      const trigger = event.target.closest?.('[data-promotion-open]');
      if (!trigger || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      open();
    };
    const tick = () => {
      const now = performance.now();
      if (!document.hidden) state.elapsed = Math.min(PROMOTION_DELAY, state.elapsed + Math.min(now - lastTick, 2000));
      lastTick = now;
      savePromotionState(storage, state);
      if (canAutoOpenPromotion({ ...state, visible: !document.hidden, blocked: blocked() })) open();
    };
    const visibility = () => { lastTick = performance.now(); };
    interval = setInterval(tick, 1000);
    document.addEventListener('click', onTrigger);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      clearInterval(interval);
      savePromotionState(storage, state);
      document.removeEventListener('click', onTrigger);
      document.removeEventListener('visibilitychange', visibility);
      document.documentElement.classList.remove('promotion-is-open');
    };
  }, []);

  const close = () => dialog.current?.close();
  const onClose = () => { document.documentElement.classList.remove('promotion-is-open'); setIsOpen(false); };
  const backdrop = event => {
    if (event.target !== dialog.current) return;
    const box = dialog.current.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) close();
  };

  return <>
    <button className="promotion-launcher" onClick={() => show.current?.()} aria-haspopup="dialog" aria-controls="furniture-promotion" aria-expanded={isOpen}>Сертификат и подарки<Icon name="arrow-right" size={18} /></button>
    <dialog ref={dialog} id="furniture-promotion" className="promotion-dialog" aria-labelledby="promotion-title" aria-describedby="promotion-description" onClose={onClose} onCancel={event => { event.preventDefault(); close(); }} onClick={backdrop}>
      <header className="promotion-dialog-header"><span>ПРИОРИТЕТ · ДЛЯ ВАШЕГО ДОМА</span><button type="button" className="promotion-close" onClick={close} aria-label="Закрыть предложение" autoFocus><Icon name="x" size={22} /></button></header>
      <div className="promotion-dialog-scroll"><div className="promotion-dialog-main">
        <figure className="promotion-certificate"><img src={marketing.certificate} alt="Сертификат ателье «Приоритет» на скидку при покупке мебели" width="760" height="984" loading="lazy" /><figcaption>Можно передать близким</figcaption></figure>
        <div className="promotion-copy"><p className="eyebrow">СЕРТИФИКАТ НА ПОКУПКУ МЕБЕЛИ</p><h2 id="promotion-title">Ваша идея.<br />Наше особое предложение.</h2><p id="promotion-description">Скидка по сертификату — до <strong>100 000 ₽</strong> на мебель для вашего дома.</p>
          <div className="promotion-rates"><div><strong>10<span>%</span></strong><span>от стоимости мебели</span></div><div><strong>15<span>%</span></strong><span>от комплексного заказа</span></div></div>
          <ul className="promotion-terms">{certificateTerms.slice(1).map(term => <li key={term}>{term}</li>)}</ul>
          <a className="button button-gold promotion-main-action" href={offerRequestUrl()}>Получить сертификат<Icon /></a><button className="promotion-later" type="button" onClick={close}>Продолжить знакомство с сайтом</button>
        </div>
      </div><div className="promotion-gifts"><div><p className="eyebrow">АЛЬТЕРНАТИВА СЕРТИФИКАТУ</p><h3>Или подарок к вашему заказу.</h3><p>Подарки зависят от суммы заказа. Подходящий вариант согласуем с вами.</p></div><div className="promotion-gift-options">{gifts.map(gift => <article key={gift.title}><h4>{gift.title}</h4><p>{gift.threshold}</p></article>)}<a className="text-link" href={offerRequestUrl('gifts')}>Уточнить условия подарков<Icon size={18} /></a></div></div></div>
    </dialog>
  </>;
}
