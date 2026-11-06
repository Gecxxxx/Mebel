import test from 'node:test';
import assert from 'node:assert/strict';
import { PROMOTION_DELAY, PROMOTION_STORAGE_KEY, readPromotionState, savePromotionState, canAutoOpenPromotion, isPromotionPage } from '../src/lib/promotion-state.js';

test('automatic promotion waits 7 seconds and never interrupts an input flow, another dialog or hidden tab', () => {
  assert.equal(PROMOTION_DELAY, 7000);
  const eligible = { elapsed: 6999, shown: false, visible: true, blocked: false };
  assert.equal(canAutoOpenPromotion(eligible), false);
  assert.equal(canAutoOpenPromotion({ ...eligible, elapsed: 7000 }), true);
  for (const override of [{ blocked: true }, { visible: false }, { shown: true }]) assert.equal(canAutoOpenPromotion({ ...eligible, elapsed: 8000, ...override }), false);
});

test('navigation preserves reading time and a dismissed or manually opened promotion stays dismissed for the visit', () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
  savePromotionState(storage, { elapsed: 4000, shown: false });
  assert.deepEqual(readPromotionState(storage), { elapsed: 4000, shown: false });
  savePromotionState(storage, { elapsed: 7000, shown: true });
  assert.equal(canAutoOpenPromotion({ ...readPromotionState(storage), visible: true, blocked: false }), false);
  assert.deepEqual([...values.keys()], [PROMOTION_STORAGE_KEY]);
});

test('unavailable or corrupted storage does not prevent browsing or opening the offer', () => {
  const unavailable = { getItem() { throw new Error('Blocked'); }, setItem() { throw new Error('Blocked'); } };
  assert.deepEqual(readPromotionState(unavailable), { elapsed: 0, shown: false });
  assert.doesNotThrow(() => savePromotionState(unavailable, { elapsed: 7000, shown: true }));
  assert.deepEqual(readPromotionState({ getItem: () => '{bad json' }), { elapsed: 0, shown: false });
  assert.deepEqual(readPromotionState({ getItem: () => '{"elapsed":-100,"shown":"yes"}' }), { elapsed: 0, shown: false });
});

test('request, privacy and error pages stay free of automatic promotions at root and under GitHub Pages', () => {
  for (const base of ['/', '/Mebel/']) {
    const prefix = base.replace(/\/$/, '');
    for (const route of ['/request/', '/privacy/', '/404.html', '/404', '/404/']) assert.equal(isPromotionPage(`${prefix}${route}`, base), false);
    for (const route of ['/', '/kuhni/', '/about/', '/stoly-i-stulya/stoly/']) assert.equal(isPromotionPage(`${prefix}${route}`, base), true);
  }
});
