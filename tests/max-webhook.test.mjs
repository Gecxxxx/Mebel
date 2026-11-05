import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequest } from '../functions/webhooks/max.js';

const body = JSON.stringify({ update_type: 'message_created', message: { body: { mid: 'test-mid', text: '/start' } } });
const callback = (overrides = {}) => new Request('https://website.example/webhooks/max', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Max-Bot-Api-Secret': 'test-secret' }, body, ...overrides });

test('MAX callbacks preserve their signed payload and service result without forwarding browser credentials', async t => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://prioritet-leads-20261105.eggetsevich.chatgpt.site/webhooks/max');
    assert.equal(options.redirect, 'manual');
    assert.equal(new TextDecoder().decode(options.body), body);
    assert.deepEqual(options.headers, { 'Content-Type': 'application/json', 'X-Max-Bot-Api-Secret': 'test-secret' });
    return Response.json({ ok: true });
  });
  const request = callback();
  request.headers.set('Cookie', 'private-cookie');
  request.headers.set('Origin', 'https://max.ru');
  request.headers.set('Authorization', 'Bearer private-token');
  const response = await onRequest({ request });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
});

test('forged callbacks and unsupported methods are rejected before reaching the service', async t => {
  const network = t.mock.method(globalThis, 'fetch', async () => { throw new Error('Unexpected network request'); });
  assert.equal((await onRequest({ request: new Request('https://website.example/webhooks/max') })).status, 405);
  assert.equal((await onRequest({ request: callback({ headers: { 'Content-Type': 'application/json' } }) })).status, 403);
  assert.equal((await onRequest({ request: callback({ headers: { 'Content-Type': 'text/plain', 'X-Max-Bot-Api-Secret': 'test-secret' } }) })).status, 415);
  assert.equal(network.mock.calls.length, 0);
});

test('oversized callbacks are bounded even without a declared content length', async t => {
  const network = t.mock.method(globalThis, 'fetch', async () => { throw new Error('Unexpected network request'); });
  assert.equal((await onRequest({ request: callback({ body: 'x'.repeat(16385) }) })).status, 413);
  const declared = callback();
  declared.headers.set('Content-Length', '16385');
  assert.equal((await onRequest({ request: declared })).status, 413);
  assert.equal(network.mock.calls.length, 0);
});

test('service errors, redirects and network failures never acknowledge delivery', async t => {
  const network = t.mock.method(globalThis, 'fetch', async () => Response.json({ error: 'Forbidden' }, { status: 403 }));
  assert.equal((await onRequest({ request: callback() })).status, 403);
  network.mock.mockImplementation(async () => new Response(null, { status: 302, headers: { Location: 'https://elsewhere.example' } }));
  assert.equal((await onRequest({ request: callback() })).status, 502);
  network.mock.mockImplementation(async () => new Response('<html>Challenge</html>', { headers: { 'Content-Type': 'text/html' } }));
  assert.equal((await onRequest({ request: callback() })).status, 502);
  network.mock.mockImplementation(async () => { throw new Error('Network unavailable'); });
  assert.equal((await onRequest({ request: callback() })).status, 503);
});
