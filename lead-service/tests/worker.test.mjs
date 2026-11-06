import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { handleBot, receiveLead, telegramEvent, maxEvent, fetchHandler, deliver } from '../worker.mjs';

function database() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../worker-schema.sql', import.meta.url), 'utf8'));
  const db = {
    prepare(query) {
      return { bind(...values) {
        const s = sqlite.prepare(query);
        return {
          first: async () => s.get(...values) || null,
          all: async () => ({ results: s.all(...values) }),
          run: async () => s.run(...values),
        };
      } };
    },
    async batch(statements) {
      sqlite.exec('BEGIN');
      try { const result = []; for (const s of statements) result.push(await s.run()); sqlite.exec('COMMIT'); return result; }
      catch (e) { sqlite.exec('ROLLBACK'); throw e; }
    },
  };
  return { DB: db, sqlite, SUBSCRIBER_PASSWORD: '684215', TELEGRAM_WEBHOOK_SECRET: 'test-tg-secret', MAX_WEBHOOK_SECRET: 'test-max-secret', ADMIN_TOKEN: 'test-admin', TELEGRAM_BOT_TOKEN: 'test-token', MAX_BOT_TOKEN: 'test-token' };
}
let sequence = 0;
const event = (platform, recipient, text) => ({ id: `test:${++sequence}`, platform, recipient, text });
const input = overrides => ({ requestId: 'request-12345678', name: 'Анна', phone: '+7 (900) 123-45-67', city: 'Елец', kind: 'Кухня', consent: true, ...overrides });
const lastReply = env => JSON.parse(env.sqlite.prepare('SELECT payload FROM outbox ORDER BY rowid DESC LIMIT 1').get().payload).text;
async function subscribe(env, platform, recipient) {
  await handleBot(env, event(platform, recipient, '/start'));
  await handleBot(env, event(platform, recipient, '6 8 4 2 1 5'));
}

test('both platforms subscribe multiple senders only after start and correct password; status and stop persist', async () => {
  const env = database();
  for (const platform of ['telegram', 'max']) {
    await handleBot(env, event(platform, '11', env.SUBSCRIBER_PASSWORD));
    assert.equal(env.sqlite.prepare('SELECT COUNT(*) AS n FROM subscribers').get().n, platform === 'telegram' ? 0 : 2);
    await handleBot(env, event(platform, '11', '/start'));
    await handleBot(env, event(platform, '11', 'wrong'));
    assert.match(lastReply(env), /не подошёл/);
    await handleBot(env, event(platform, '11', env.SUBSCRIBER_PASSWORD));
    await subscribe(env, platform, '22');
    await handleBot(env, event(platform, '11', '/status'));
    assert.match(lastReply(env), /Подписка включена/);
  }
  assert.equal(env.sqlite.prepare('SELECT COUNT(*) AS n FROM subscribers WHERE active=1').get().n, 4);
  const lead = await receiveLead(env.DB, input());
  assert.equal(env.sqlite.prepare('SELECT COUNT(*) AS n FROM outbox WHERE lead_id=?').get(lead.id).n, 4);
  await handleBot(env, event('telegram', '11', '/stop'));
  await handleBot(env, event('telegram', '11', '/status'));
  assert.match(lastReply(env), /Подписка выключена/);
  assert.equal(env.sqlite.prepare("SELECT status FROM outbox WHERE lead_id=? AND platform='telegram' AND recipient='11'").get(lead.id).status, 'cancelled');
  const next = await receiveLead(env.DB, input({ requestId: 'request-next-12345' }));
  assert.equal(env.sqlite.prepare('SELECT COUNT(*) AS n FROM outbox WHERE lead_id=?').get(next.id).n, 3);
  env.sqlite.close();
});

test('webhook retries and website retries do not duplicate state or notification records', async () => {
  const env = database();
  const e = event('max', '22', '/start');
  await handleBot(env, e);
  assert.equal((await handleBot(env, e)).duplicate, true);
  assert.equal(env.sqlite.prepare('SELECT COUNT(*) AS n FROM outbox').get().n, 1);
  const first = await receiveLead(env.DB, input());
  const retry = await receiveLead(env.DB, input());
  assert.equal(first.id, retry.id);
  assert.equal(retry.duplicate, true);
  await assert.rejects(receiveLead(env.DB, input({ name: 'Ирина' })), e => e.status === 409);
  await assert.rejects(receiveLead(env.DB, input({ consent: false })));
  await assert.rejects(receiveLead(env.DB, input({ phone: '123' })));
  assert.equal(env.sqlite.prepare('SELECT COUNT(*) AS n FROM leads').get().n, 1);
  env.sqlite.close();
});

test('password attempts are limited per sender and secrets are never stored', async () => {
  const env = database();
  await handleBot(env, event('telegram', '11', '/start'));
  for (let i = 0; i < 5; i++) await handleBot(env, event('telegram', '11', 'wrong'));
  await handleBot(env, event('telegram', '11', env.SUBSCRIBER_PASSWORD));
  assert.match(lastReply(env), /15 минут/);
  assert.equal(env.sqlite.prepare('SELECT COUNT(*) AS n FROM subscribers').get().n, 0);
  const dump = JSON.stringify(['events','sessions','outbox','rate_limits'].map(table => env.sqlite.prepare(`SELECT * FROM ${table}`).all()));
  assert.equal(dump.includes(env.SUBSCRIBER_PASSWORD), false);
  await subscribe(env, 'max', '22');
  assert.equal(env.sqlite.prepare('SELECT COUNT(*) AS n FROM subscribers').get().n, 1);
  env.sqlite.close();
});

test('MAX uses actual sender, ignores groups, and client payload opens customer quiz', async () => {
  const env = database();
  const e = await maxEvent({ update_type: 'message_created', message: { sender: { user_id: 123 }, recipient: { user_id: 999, chat_type: 'dialog' }, body: { mid: 'mid-1', text: '/start' } } });
  assert.equal(e.recipient, '123');
  assert.equal(await maxEvent({ update_type: 'message_created', message: { sender: { user_id: 123 }, recipient: { chat_type: 'chat' }, body: { mid: 'mid-1' } } }), null);
  assert.equal(telegramEvent({ update_id: 3, message: { chat: { type: 'group', id: 1 }, from: { id: 1 } } }), null);
  const client = await maxEvent({ update_type: 'bot_started', timestamp: 1, user: { user_id: 123 }, payload: 'client' });
  await handleBot(env, client);
  assert.match(lastReply(env), /#project-quiz/);
  assert.equal(env.sqlite.prepare('SELECT COUNT(*) AS n FROM sessions').get().n, 0);
  env.sqlite.close();
});

test('public API rejects forged webhooks, public reads, other origins and oversized requests', async () => {
  const env = database(), context = { waitUntil() {} };
  for (const path of ['/webhooks/telegram','/webhooks/max','/internal/verify']) assert.equal((await fetchHandler(new Request(`https://api.example${path}`, { method: 'POST', body: '{}' }), env, context)).status, 403);
  assert.equal((await fetchHandler(new Request('https://api.example/api/leads'), env, context)).status, 404);
  assert.equal((await fetchHandler(new Request('https://api.example/api/leads', { method: 'POST', headers: { Origin: 'https://other.example' }, body: JSON.stringify(input()) }), env, context)).status, 403);
  assert.equal((await fetchHandler(new Request('https://api.example/api/leads', { method: 'POST', body: 'x'.repeat(17000) }), env, context)).status, 413);
  const response = await fetchHandler(new Request('https://api.example/api/leads', { method: 'POST', headers: { Origin: 'https://gecxxxx.github.io' }, body: JSON.stringify(input()) }), env, context);
  assert.equal(response.status, 202);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://gecxxxx.github.io');
  assert.equal((await response.json()).accepted, true);
  env.sqlite.close();
});

test('signed lead gateway keeps per-visitor rate limits and forged forwarding headers cannot evade them', async () => {
  const env = database(), context = { waitUntil() {} };
  env.LEAD_PROXY_SECRET = 'separate-lead-proxy-signature-for-tests';
  const send = (address, signature = env.LEAD_PROXY_SECRET) => fetchHandler(new Request('https://api.example/api/leads', {
    method: 'POST',
    headers: { 'CF-Connecting-IP': '203.0.113.10', 'X-Prioritet-Client-IP': address, 'X-Prioritet-Proxy-Secret': signature },
    body: JSON.stringify({ consent: false }),
  }), env, context);
  for (let i = 0; i < 12; i++) assert.equal((await send('198.51.100.20')).status, 400);
  assert.equal((await send('198.51.100.20')).status, 429);
  assert.equal((await send('198.51.100.21')).status, 400, 'Another visitor must not share the proxy IP rate limit');
  for (let i = 0; i < 12; i++) assert.equal((await send(`198.51.100.${100+i}`, 'forged-signature')).status, 400);
  assert.equal((await send('198.51.100.222', 'forged-signature')).status, 429);
  assert.equal(env.sqlite.prepare('SELECT COUNT(*) AS n FROM leads').get().n, 0);
  assert.equal(env.sqlite.prepare('SELECT COUNT(*) AS n FROM outbox').get().n, 0);
  env.sqlite.close();
});

test('MAX configuration preserves a separate website callback and still supports the direct service URL', async t => {
  const env = database();
  env.SERVICE_ORIGIN = 'https://service.example';
  env.MAX_API_BASE_URL = 'https://platform-api.max.ru';
  const callbacks = [];
  const network = t.mock.method(globalThis, 'fetch', async (url, options) => {
    if (url.endsWith('/subscriptions')) {
      if (options.method === 'GET') return Response.json({ subscriptions: [] });
      callbacks.push(JSON.parse(options.body));
      return Response.json({ success: true });
    }
    return Response.json({ ok: true, result: true });
  });
  const configure = () => fetchHandler(new Request('https://service.example/internal/configure', { method: 'POST', headers: { Authorization: `Bearer ${env.ADMIN_TOKEN}` } }), env, { waitUntil() {} });
  for (const callback of [undefined, 'https://website.example/webhooks/max']) {
    env.MAX_WEBHOOK_URL = callback;
    assert.equal((await configure()).status, 200);
    assert.equal(callbacks.at(-1).url, callback || 'https://service.example/webhooks/max');
    assert.deepEqual(callbacks.at(-1).update_types, ['bot_started', 'message_created']);
    assert.equal(callbacks.at(-1).secret, env.MAX_WEBHOOK_SECRET);
  }
  const count = network.mock.calls.length;
  env.MAX_WEBHOOK_URL = 'http://website.example/webhooks/max';
  assert.equal((await configure()).status, 500);
  assert.equal(network.mock.calls.length, count);
  env.sqlite.close();
});

test('delivery is acknowledged only after API success and failures remain queued', async t => {
  const env = database();
  await subscribe(env, 'telegram', '11');
  env.sqlite.exec('DELETE FROM outbox');
  const lead = await receiveLead(env.DB, input());
  let called = 0;
  t.mock.method(globalThis, 'fetch', async () => { called++; return Response.json({ ok: false }, { status: 503 }); });
  await deliver(env, lead.id);
  assert.equal(called, 1);
  let row = env.sqlite.prepare('SELECT * FROM outbox').get();
  assert.equal(row.status, 'pending');
  assert.equal(row.attempts, 1);
  assert.ok(row.next_try > Date.now());
  env.sqlite.exec('UPDATE outbox SET next_try=0; DELETE FROM delivery_slots');
  globalThis.fetch.mock.mockImplementation(async () => Response.json({ ok: true, result: { message_id: 1 } }));
  await deliver(env, lead.id);
  row = env.sqlite.prepare('SELECT * FROM outbox').get();
  assert.equal(row.status, 'sent');
  await deliver(env, lead.id);
  assert.equal(globalThis.fetch.mock.calls.length, 2);
  env.sqlite.close();
});
