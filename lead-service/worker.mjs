const json = (value, status = 200, headers = {}) => Response.json(value, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers } });
const clean = (value, n = 300) => String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, n);
const sql = (db, query, ...values) => db.prepare(query).bind(...values);
const all = async statement => (await statement.all()).results || [];
const hash = async value => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))).map(v => v.toString(16).padStart(2, '0')).join('');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
export class InputError extends Error { constructor(message, status = 400) { super(message); this.status = status; } }
export async function secretMatches(actual, expected) {
  if (!actual || !expected) return false;
  const [a, b] = await Promise.all([hash(String(actual)), hash(String(expected))]);
  let difference = 0; for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
}
export function normalizeLead(input) {
  if (!input || input.consent !== true) throw new InputError('Необходимо согласие на обработку данных.');
  const data = { name: clean(input.name, 100), phone: clean(input.phone, 30), kind: clean(input.kind, 100), city: clean(input.city, 100), project: clean(input.project || 'Обсудим при обращении', 250), timing: clean(input.timing || 'Уточним при разговоре', 100), messenger: clean(input.messenger || 'По телефону', 30), comment: clean(input.comment, 1500), source: clean(input.source, 40), consent: true, consentVersion: clean(input.consentVersion, 40) };
  const requestId = clean(input.requestId, 120);
  if (!/^[a-zA-Z0-9_:.\-]{8,120}$/.test(requestId)) throw new InputError('Обновите страницу и попробуйте ещё раз.');
  if (data.name.length < 2 || data.city.length < 2 || !data.kind) throw new InputError('Укажите имя, город и тип мебели.');
  const digits = data.phone.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) throw new InputError('Проверьте номер телефона.');
  data.phone = data.phone.startsWith('+') ? `+${digits}` : digits;
  return { requestId, data };
}
function leadText(id, p) { return `Новая заявка ${id}\n\nМебель: ${p.kind}\nГород: ${p.city}\nПодготовка: ${p.project}\nПланы: ${p.timing}\nИмя: ${p.name}\nТелефон: ${p.phone}\nСвязь: ${p.messenger}${p.comment ? `\nПожелания: ${p.comment}` : ''}\nИсточник: ${p.source}\nСогласие на обработку данных: получено`; }
function outgoing(db, id, platform, recipient, text, leadId = null) { return sql(db, 'INSERT OR IGNORE INTO outbox(id,platform,recipient,lead_id,payload,next_try,created_at) VALUES(?,?,?,?,?,?,?)', id, platform, String(recipient), leadId, JSON.stringify({ text }), Date.now(), Date.now()); }
export async function receiveLead(db, input, { notify = true } = {}) {
  const { requestId, data } = normalizeLead(input);
  const digest = await hash(JSON.stringify(data));
  const existing = await sql(db, 'SELECT id,digest FROM leads WHERE request_id=?', requestId).first();
  if (existing) {
    if (existing.digest !== digest) throw new InputError('Этот запрос уже отправлен с другими данными.', 409);
    return { id: existing.id, duplicate: true };
  }
  const id = `P-${crypto.randomUUID().replaceAll('-', '').slice(0, 16).toUpperCase()}`;
  const subscribers = notify ? await all(sql(db, 'SELECT platform,recipient FROM subscribers WHERE active=1')) : [];
  const statements = [sql(db, 'INSERT INTO leads(id,request_id,digest,payload,created_at) VALUES(?,?,?,?,?)', id, requestId, digest, JSON.stringify(data), Date.now()), ...subscribers.map(s => outgoing(db, `lead:${id}:${s.platform}:${s.recipient}`, s.platform, s.recipient, leadText(id, data), id))];
  try { await db.batch(statements); }
  catch (error) {
    const retry = await sql(db, 'SELECT id,digest FROM leads WHERE request_id=?', requestId).first();
    if (!retry) throw error;
    if (retry.digest !== digest) throw new InputError('Этот запрос уже отправлен с другими данными.', 409);
    return { id: retry.id, duplicate: true };
  }
  return { id, duplicate: false };
}
export function telegramEvent(update) {
  const m = update.message;
  if (update.update_id == null || m?.chat?.type !== 'private' || !m.from || m.from.is_bot) return null;
  return { id: `tg:${update.update_id}`, platform: 'telegram', recipient: String(m.chat.id), text: m.text || '' };
}
export async function maxEvent(update) {
  if (update.update_type === 'bot_started' && update.user && !update.user.is_bot) return { id: `max:start:${await hash(JSON.stringify([update.timestamp, update.user.user_id, update.payload]))}`, platform: 'max', recipient: String(update.user.user_id), text: '/start', payload: update.payload || '' };
  if (update.update_type !== 'message_created' || !update.message?.sender || update.message.sender.is_bot || !update.message.body?.mid) return null;
  if (update.message.recipient?.chat_type && update.message.recipient.chat_type !== 'dialog') return null;
  return { id: `max:${update.message.body.mid}`, platform: 'max', recipient: String(update.message.sender.user_id), text: update.message.body.text || '' };
}
async function rate(db, id, max, duration) {
  const now = Date.now();
  const row = await sql(db, 'INSERT INTO rate_limits(id,count,expires_at) VALUES(?,1,?) ON CONFLICT(id) DO UPDATE SET count=CASE WHEN expires_at<? THEN 1 ELSE count+1 END,expires_at=CASE WHEN expires_at<? THEN excluded.expires_at ELSE expires_at END RETURNING count', id, now + duration, now, now).first();
  return row.count <= max;
}
export async function handleBot(env, event) {
  const db = env.DB;
  if (await sql(db, 'SELECT 1 FROM events WHERE id=?', event.id).first()) return { duplicate: true };
  const id = `${event.platform}:${event.recipient}`, text = clean(event.text, 2000);
  const active = !!await sql(db, 'SELECT 1 FROM subscribers WHERE platform=? AND recipient=? AND active=1', event.platform, event.recipient).first();
  const session = await sql(db, 'SELECT payload FROM sessions WHERE id=?', id).first();
  const actions = [sql(db, 'INSERT INTO events(id,created_at) VALUES(?,?)', event.id, Date.now())];
  let response;
  if (event.payload === 'client' || /^\/start(?:@\w+)?\s+client$/.test(text)) response = 'Здравствуйте! Обсудим мебель для вашего дома.\n\nРасскажите о своей идее в коротком опросе: https://gecxxxx.github.io/Mebel/#project-quiz\n\nМожно также позвонить в ателье: +7 (961) 606-93-09.';
  else if (/^\/status(?:@\w+)?$/.test(text)) response = active ? 'Подписка включена ✅\nНовые заявки сайта будут приходить в этот чат.\n\n/status — проверить подписку\n/stop — отключить получение заявок' : 'Подписка выключена.\nДля получения заявок нажмите /start и введите пароль.';
  else if (/^\/stop(?:@\w+)?$/.test(text)) {
    actions.push(sql(db, 'UPDATE subscribers SET active=0 WHERE platform=? AND recipient=?', event.platform, event.recipient), sql(db, 'DELETE FROM sessions WHERE id=?', id), sql(db, "UPDATE outbox SET status='cancelled' WHERE platform=? AND recipient=? AND status='pending' AND lead_id IS NOT NULL", event.platform, event.recipient));
    response = 'Подписка отключена. Новые заявки сюда не поступают. Подключиться снова: /start.';
  } else if (/^\/start(?:@\w+)?(?:\s.*)?$/.test(text)) {
    if (active) response = 'Вы уже подписаны на заявки ателье.\n/status — проверить подписку\n/stop — отключить подписку';
    else {
      actions.push(sql(db, 'INSERT INTO sessions(id,payload,updated_at) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at', id, JSON.stringify({ awaitingPassword: true }), Date.now()));
      response = 'Здравствуйте! Здесь можно подписаться на заявки ателье «Приоритет».\n\nВведите пароль доступа.';
    }
  } else if (session && JSON.parse(session.payload).awaitingPassword) {
    if (!await rate(db, `password:${id}`, 5, 900000)) response = 'Слишком много попыток. Подождите 15 минут и попробуйте снова.';
    else if (await secretMatches(text.replace(/\s/g, ''), env.SUBSCRIBER_PASSWORD)) {
      actions.push(sql(db, 'INSERT INTO subscribers(platform,recipient,active,created_at) VALUES(?,?,1,?) ON CONFLICT(platform,recipient) DO UPDATE SET active=1', event.platform, event.recipient, Date.now()), sql(db, 'DELETE FROM sessions WHERE id=?', id));
      response = 'Готово! Подписка на заявки включена ✅\nНовые обращения с сайта будут приходить сюда.\n\n/status — проверить подписку\n/stop — отключить получение заявок';
    } else response = 'Пароль не подошёл. Проверьте его и попробуйте ещё раз.';
  } else response = active ? 'Приём заявок включён. Проверка: /status. Отключение: /stop.' : 'Для подписки на заявки нажмите /start и введите пароль. Проверка подписки: /status.';
  actions.push(outgoing(db, `reply:${event.id}`, event.platform, event.recipient, response));
  try { await db.batch(actions); }
  catch (error) { if (await sql(db, 'SELECT 1 FROM events WHERE id=?', event.id).first()) return { duplicate: true }; throw error; }
  return { duplicate: false };
}
export async function callBot(env, platform, method, body, verb = 'POST') {
  let url, headers = { 'Content-Type': 'application/json' };
  if (platform === 'telegram') {
    if (!env.TELEGRAM_BOT_TOKEN) throw new Error('Telegram not configured');
    url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`;
  } else {
    const base = env.MAX_API_BASE_URL || 'https://platform-api2.max.ru';
    if (!['https://platform-api2.max.ru', 'https://platform-api.max.ru'].includes(base) || !env.MAX_BOT_TOKEN) throw new Error('MAX not configured');
    url = `${base}${method}`; headers.Authorization = env.MAX_BOT_TOKEN;
  }
  const response = await fetch(url, { method: verb, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(8000), redirect: 'manual' });
  if (!response.ok) throw new Error(`${platform} API status ${response.status}`);
  let result; try { result = await response.json(); } catch { throw new Error(`${platform} response invalid`); }
  if (!response.ok || result.ok === false || result.success === false || result.code) throw new Error(`${platform} API status ${response.status}`);
  return platform === 'telegram' ? result.result : result;
}
export async function deliver(env, leadId = null) {
  const db = env.DB, now = Date.now(), deadline = now + 23000;
  const pending = await all(leadId ? sql(db, "SELECT * FROM outbox WHERE ((status='pending' AND next_try<=?) OR (status='sending' AND lease_until<?)) AND lead_id=? ORDER BY created_at LIMIT 60", now, now, leadId) : sql(db, "SELECT * FROM outbox WHERE (status='pending' AND next_try<=?) OR (status='sending' AND lease_until<?) ORDER BY created_at LIMIT 60", now, now));
  for (let offset = 0; offset < pending.length && Date.now() < deadline; offset += 6) {
    await Promise.all(pending.slice(offset, offset + 6).map(async row => {
      const claimed = await sql(db, "UPDATE outbox SET status='sending',lease_until=? WHERE id=? AND ((status='pending' AND next_try<=?) OR (status='sending' AND lease_until<?)) RETURNING id", Date.now() + 35000, row.id, Date.now(), Date.now()).first();
      if (!claimed) return;
      if (row.lead_id && !await sql(db, 'SELECT 1 FROM subscribers WHERE platform=? AND recipient=? AND active=1', row.platform, row.recipient).first()) { await sql(db, "UPDATE outbox SET status='cancelled' WHERE id=?", row.id).run(); return; }
      const slot = await sql(db, 'INSERT INTO delivery_slots(id,next_send) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET next_send=max(next_send,?)+1100 RETURNING next_send', `${row.platform}:${row.recipient}`, Date.now() + 1100, Date.now()).first();
      await sleep(Math.max(0, slot.next_send - 1100 - Date.now()));
      try {
        const message = JSON.parse(row.payload);
        if (row.platform === 'telegram') await callBot(env, 'telegram', 'sendMessage', { chat_id: row.recipient, text: message.text.slice(0, 4000), link_preview_options: { is_disabled: true } });
        else await callBot(env, 'max', `/messages?user_id=${encodeURIComponent(row.recipient)}`, { text: message.text.slice(0, 4000) });
        await sql(db, "UPDATE outbox SET status='sent',attempts=attempts+1,lease_until=0 WHERE id=?", row.id).run();
      } catch {
        await sql(db, "UPDATE outbox SET status='pending',attempts=attempts+1,next_try=?,lease_until=0 WHERE id=?", Date.now() + Math.min(3600000, 10000 * 2 ** Math.min(row.attempts, 8)), row.id).run();
      }
    }));
    if (offset + 6 < pending.length) await sleep(650);
  }
}
async function requestBody(request) {
  if (Number(request.headers.get('Content-Length')) > 16384) throw new InputError('Запрос слишком большой.', 413);
  const reader = request.body?.getReader(); let raw = '', total = 0; const decoder = new TextDecoder();
  if (!reader) throw new InputError('Нет данных запроса.');
  while (true) { const chunk = await reader.read(); if (chunk.done) break; total += chunk.value.byteLength; if (total > 16384) { await reader.cancel(); throw new InputError('Запрос слишком большой.', 413); } raw += decoder.decode(chunk.value, { stream: true }); }
  raw += decoder.decode(); try { return JSON.parse(raw); } catch { throw new InputError('Не удалось прочитать данные.'); }
}
export async function fetchHandler(request, env, ctx) {
  const url = new URL(request.url), origin = request.headers.get('Origin');
  const allowed = (env.ALLOWED_ORIGINS || 'https://gecxxxx.github.io').split(',').map(s => s.trim());
  const cors = origin && allowed.includes(origin) ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } : {};
  try {
    if (origin && !allowed.includes(origin)) return json({ error: 'Источник запроса не разрешён.' }, 403);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method === 'GET' && ['/','/health'].includes(url.pathname)) return json({ ok: true, service: 'prioritet-leads', database: !!env.DB, configured: !!(env.TELEGRAM_BOT_TOKEN && env.MAX_BOT_TOKEN && env.SUBSCRIBER_PASSWORD) }, 200, cors);
    if (!env.DB) return json({ error: 'Сервис приёма временно недоступен.' }, 503, cors);
    if (url.pathname.startsWith('/internal/')) {
      if (!await secretMatches(request.headers.get('Authorization'), `Bearer ${env.ADMIN_TOKEN || ''}`) || !env.ADMIN_TOKEN) return json({ error: 'Forbidden' }, 403);
      if (url.pathname === '/internal/verify' && request.method === 'POST') {
        const results = await Promise.allSettled([callBot(env, 'telegram', 'getMe', {}), callBot(env, 'max', '/me', undefined, 'GET')]);
        const safeResult = (r, platform) => {
          if (r.status === 'fulfilled') return { ok: true, username: r.value.username };
          let detail = String(r.reason?.message || 'Network error');
          for (const value of Object.values(env)) if (typeof value === 'string' && value.length > 8) detail = detail.replaceAll(value, '[redacted]');
          return { ok: false, error: detail.slice(0, 300) };
        };
        const table = await sql(env.DB, 'SELECT COUNT(*) AS count FROM subscribers WHERE active=1').first();
        return json({ telegram: safeResult(results[0], 'telegram'), max: safeResult(results[1], 'max'), database: true, activeSubscriptions: table.count });
      }
      if (url.pathname === '/internal/configure' && request.method === 'POST') {
        const base = new URL(env.SERVICE_ORIGIN);
        if (base.protocol !== 'https:') throw new Error('Invalid service origin');
        const maxWebhook = new URL(env.MAX_WEBHOOK_URL || '/webhooks/max', base);
        if (maxWebhook.protocol !== 'https:') throw new Error('Invalid MAX webhook URL');
        await callBot(env, 'telegram', 'setWebhook', { url: `${base.origin}/webhooks/telegram`, secret_token: env.TELEGRAM_WEBHOOK_SECRET, allowed_updates: ['message'], max_connections: 1, drop_pending_updates: false });
        const current = await callBot(env, 'max', '/subscriptions', undefined, 'GET');
        if (!current.subscriptions?.some(s => s.url === maxWebhook.href)) {
          const result = await callBot(env, 'max', '/subscriptions', { url: maxWebhook.href, update_types: ['bot_started','message_created'], secret: env.MAX_WEBHOOK_SECRET });
          if (!result.success) throw new Error('MAX subscription failed');
        }
        await callBot(env, 'telegram', 'setMyCommands', { commands: [{ command: 'start', description: 'Подписаться на заявки' }, { command: 'status', description: 'Проверить подписку' }, { command: 'stop', description: 'Отключить получение заявок' }] });
        return json({ telegramConfigured: true, maxConfigured: true });
      }
      if (url.pathname === '/internal/self-test' && request.method === 'POST') {
        const requestId = `codex-acceptance-${crypto.randomUUID()}`;
        const input = { requestId, name: 'Тест системы', phone: '+70000000000', city: 'Тест', kind: 'Проверка интеграции', consent: true, source: 'internal-self-test' };
        const first = await receiveLead(env.DB, input, { notify: false });
        const second = await receiveLead(env.DB, input, { notify: false });
        await sql(env.DB, 'DELETE FROM leads WHERE request_id=?', requestId).run();
        return json({ persistenceVerified: !!first.id, idempotencyVerified: first.id === second.id, notificationsSent: false, testRecordRemoved: true });
      }
      return json({ error: 'Not found' }, 404);
    }
    if (request.method === 'POST' && url.pathname === '/api/leads') {
      const rateKey = await hash(`${env.TELEGRAM_WEBHOOK_SECRET}:${request.headers.get('CF-Connecting-IP') || 'unknown'}`);
      if (!await rate(env.DB, `website:${rateKey}`, 12, 600000)) return json({ error: 'Слишком много обращений. Попробуйте немного позже.' }, 429, cors);
      const result = await receiveLead(env.DB, await requestBody(request));
      await deliver(env, result.id);
      const delivered = !!await sql(env.DB, "SELECT 1 FROM outbox WHERE lead_id=? AND status='sent' LIMIT 1", result.id).first();
      ctx.waitUntil(deliver(env).catch(() => {}));
      return json({ accepted: true, leadId: result.id, delivered }, 202, cors);
    }
    if (request.method === 'POST' && ['/webhooks/telegram','/webhooks/max'].includes(url.pathname)) {
      const telegram = url.pathname.endsWith('telegram');
      const expected = telegram ? env.TELEGRAM_WEBHOOK_SECRET : env.MAX_WEBHOOK_SECRET;
      const supplied = request.headers.get(telegram ? 'X-Telegram-Bot-Api-Secret-Token' : 'X-Max-Bot-Api-Secret');
      if (!await secretMatches(supplied, expected)) return json({ error: 'Forbidden' }, 403);
      const input = await requestBody(request);
      const event = telegram ? telegramEvent(input) : await maxEvent(input);
      if (event) await handleBot(env, event);
      ctx.waitUntil(deliver(env).catch(() => {}));
      return json({ ok: true });
    }
    return json({ error: 'Not found' }, 404, cors);
  } catch (error) { return json({ error: error instanceof InputError ? error.message : 'Не удалось обработать обращение. Попробуйте ещё раз.' }, error instanceof InputError ? error.status : 500, cors); }
}
export default { fetch: fetchHandler };
