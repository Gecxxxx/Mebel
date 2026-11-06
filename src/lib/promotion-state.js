export const PROMOTION_DELAY = 7000;
export const PROMOTION_STORAGE_KEY = 'prioritet-promotion-session-v1';

export function readPromotionState(storage) {
  try {
    const value = JSON.parse(storage?.getItem(PROMOTION_STORAGE_KEY) || 'null');
    return { elapsed: Number.isFinite(value?.elapsed) ? Math.max(0, Math.min(PROMOTION_DELAY, value.elapsed)) : 0, shown: value?.shown === true };
  } catch { return { elapsed: 0, shown: false }; }
}
export function savePromotionState(storage, state) {
  try { storage?.setItem(PROMOTION_STORAGE_KEY, JSON.stringify(state)); } catch { /* Browsing remains usable when storage is unavailable. */ }
}
export function canAutoOpenPromotion({ elapsed, shown, visible, blocked }) {
  return elapsed >= PROMOTION_DELAY && !shown && visible && !blocked;
}
export function isPromotionPage(pathname, base = '/') {
  const prefix = base.replace(/\/$/, '');
  const path = prefix && pathname.startsWith(`${prefix}/`) ? pathname.slice(prefix.length) : pathname;
  return !/^\/(?:request|privacy)(?:\/|$)/.test(path) && !/^\/404(?:\.html)?\/?$/.test(path);
}
