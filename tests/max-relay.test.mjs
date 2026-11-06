import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { request } from 'node:http';
import { createMaxRelay } from '../lead-service/max-relay/server.mjs';

const secret = 'integration-test-secret-with-32-characters';
async function start(t, fetchImpl) {
  const server = createMaxRelay({ secret, fetchImpl });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  return `http://127.0.0.1:${server.address().port}`;
}
const headers = { 'Content-Type': 'application/json', 'X-Max-Bot-Api-Secret': secret };

test('VPS relay authenticates requests and preserves accepted events without forwarding unrelated credentials', async t => {
  let calls = 0;
  const body = JSON.stringify({ update_type: 'message_created', message: { body: { mid: 'test', text: '/start' } } });
  const url = await start(t, async (target, options) => {
    calls++;
    assert.equal(target, 'https://prioritet-leads-20261105.eggetsevich.chatgpt.site/webhooks/max');
    assert.equal(options.body.toString(), body);
    assert.deepEqual(options.headers, headers);
    assert.equal(options.redirect, 'manual');
    return Response.json({ ok: true });
  });
  assert.equal((await fetch(`${url}/health`)).status, 200);
  assert.equal((await fetch(`${url}/webhooks/max`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })).status, 403);
  assert.equal((await fetch(`${url}/webhooks/max`, { method: 'POST', headers: { ...headers, 'X-Max-Bot-Api-Secret': `${secret}wrong` }, body })).status, 403);
  const accepted = await fetch(`${url}/webhooks/max`, { method: 'POST', headers: { ...headers, Cookie: 'private', Authorization: 'private' }, body });
  assert.equal(accepted.status, 200);
  assert.deepEqual(await accepted.json(), { ok: true });
  assert.equal(calls, 1);
});

test('VPS relay bounds declared and streamed requests before contacting the service', async t => {
  const url = await start(t, () => { throw new Error('Must not contact service'); });
  assert.equal((await fetch(`${url}/webhooks/max`)).status, 405);
  assert.equal((await fetch(`${url}/webhooks/max`, { method: 'POST', headers: { ...headers, 'Content-Type': 'text/plain' }, body: '{}' })).status, 415);
  assert.equal((await fetch(`${url}/webhooks/max`, { method: 'POST', headers, body: '{invalid' })).status, 400);
  assert.equal((await fetch(`${url}/webhooks/max`, { method: 'POST', headers, body: 'x'.repeat(16385) })).status, 413);
  const streamed = await new Promise((resolve, reject) => {
    const req = request(`${url}/webhooks/max`, { method: 'POST', headers }, response => { response.resume(); response.on('end', () => resolve(response.statusCode)); });
    req.on('error', reject);
    req.write('x'.repeat(9000));
    req.end('x'.repeat(9000));
  });
  assert.equal(streamed, 413);
});

test('VPS relay never acknowledges network errors, redirects or malformed service responses as successful delivery', async t => {
  let result = () => Response.json({ error: 'Forbidden' }, { status: 403 });
  const url = await start(t, () => result());
  const send = () => fetch(`${url}/webhooks/max`, { method: 'POST', headers, body: '{}' });
  assert.equal((await send()).status, 403);
  result = () => new Response(null, { status: 302, headers: { Location: 'https://elsewhere.example' } });
  assert.equal((await send()).status, 502);
  result = () => new Response('<html>challenge</html>');
  assert.equal((await send()).status, 502);
  result = () => new Response('invalid', { headers: { 'Content-Type': 'application/json' } });
  assert.equal((await send()).status, 502);
  result = () => { throw new Error('Network down'); };
  assert.equal((await send()).status, 503);
  assert.throws(() => createMaxRelay({ secret: '' }), /MAX_WEBHOOK_SECRET/);
});
