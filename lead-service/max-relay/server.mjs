import { createServer } from 'node:http';
import { createHash, timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const upstream = 'https://prioritet-leads-20261105.eggetsevich.chatgpt.site';
const bodyLimit = 16384;
const digest = value => createHash('sha256').update(value).digest();
const respond = (response, status, value, headers = {}) => {
  response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', Connection: 'close', ...headers });
  response.end(JSON.stringify(value));
};

export function createMaxRelay({ secret, leadProxySecret, allowedOrigins = [], fetchImpl = fetch } = {}) {
  if (!/^[a-zA-Z0-9_-]{32,256}$/.test(secret || '')) throw new Error('MAX_WEBHOOK_SECRET must contain 32–256 permitted characters');
  if (leadProxySecret && !/^[a-zA-Z0-9_-]{32,256}$/.test(leadProxySecret)) throw new Error('Invalid LEAD_PROXY_SECRET');
  const expected = digest(secret);
  const server = createServer(async (request, response) => {
    if (request.method === 'GET' && request.url === '/health') return respond(response, 200, { ok: true, service: 'prioritet-max-relay' });
    const lead = request.url === '/api/leads';
    if (!lead && request.url !== '/webhooks/max') return respond(response, 404, { error: 'Not found' });
    const origin = request.headers.origin;
    const cors = lead && origin && allowedOrigins.includes(origin) ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin', 'Access-Control-Allow-Methods': 'POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } : {};
    const reply = (status, value) => respond(response, status, value, cors);
    if (lead) {
      if (origin && !allowedOrigins.includes(origin)) return reply(403, { error: 'Источник запроса не разрешён.' });
      if (!leadProxySecret) return reply(503, { error: 'Сервис приёма временно недоступен.' });
      if (request.method === 'OPTIONS') { response.writeHead(204, { ...cors, 'Cache-Control': 'no-store' }); response.end(); return; }
    } else {
      const supplied = request.headers['x-max-bot-api-secret'];
      if (request.method === 'POST' && (typeof supplied !== 'string' || !timingSafeEqual(digest(supplied), expected))) return reply(403, { error: 'Forbidden' });
    }
    if (request.method !== 'POST') return reply(405, { error: 'POST required' });
    if (!request.headers['content-type']?.toLowerCase().startsWith('application/json')) return reply(415, { error: 'JSON required' });
    if (Number(request.headers['content-length']) > bodyLimit) return reply(413, { error: 'Request too large' });
    try {
      const chunks = [];
      let size = 0;
      for await (const chunk of request.iterator({ destroyOnReturn: false })) {
        size += chunk.length;
        if (size > bodyLimit) return reply(413, { error: 'Request too large' });
        chunks.push(chunk);
      }
      if (!size) return reply(400, { error: 'Empty request' });
      const body = Buffer.concat(chunks);
      try { JSON.parse(body.toString('utf8')); } catch { return reply(400, { error: 'Invalid JSON' }); }
      const forwarding = { 'Content-Type': 'application/json' };
      if (lead) {
        if (origin) forwarding.Origin = origin;
        forwarding['X-Prioritet-Proxy-Secret'] = leadProxySecret;
        // nginx replaces this header with the connection's actual client IP.
        const clientIP = request.headers['x-real-ip'] || request.socket.remoteAddress;
        if (typeof clientIP !== 'string' || !isIP(clientIP)) return reply(400, { error: 'Invalid client address' });
        forwarding['X-Prioritet-Client-IP'] = clientIP;
      } else forwarding['X-Max-Bot-Api-Secret'] = secret;
      const result = await fetchImpl(upstream + (lead ? '/api/leads' : '/webhooks/max'), {
        method: 'POST',
        headers: forwarding,
        body,
        redirect: 'manual',
        signal: AbortSignal.timeout(20000),
      });
      if (result.status >= 300 && result.status < 400 || !result.headers.get('Content-Type')?.includes('application/json')) return reply(502, { error: 'Invalid service response' });
      const text = await result.text();
      try { JSON.parse(text); } catch { return reply(502, { error: 'Invalid service response' }); }
      response.writeHead(result.status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', Connection: 'close', ...cors });
      response.end(text);
    } catch {
      reply(503, { error: 'Сервис временно недоступен. Попробуйте ещё раз.' });
    }
  });
  server.headersTimeout = 10000;
  server.requestTimeout = 15000;
  server.keepAliveTimeout = 5000;
  return server;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const port = Number(process.env.MAX_RELAY_PORT || 8789);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid MAX_RELAY_PORT');
  const server = createMaxRelay({ secret: process.env.MAX_WEBHOOK_SECRET, leadProxySecret: process.env.LEAD_PROXY_SECRET, allowedOrigins: (process.env.ALLOWED_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean) });
  server.listen(port, '127.0.0.1', () => console.log(`MAX webhook relay listening on 127.0.0.1:${port}`));
}
