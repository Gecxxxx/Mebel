import { createServer } from 'node:http';
import { createHash, timingSafeEqual } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const upstream = 'https://prioritet-leads-20261105.eggetsevich.chatgpt.site/webhooks/max';
const bodyLimit = 16384;
const digest = value => createHash('sha256').update(value).digest();
const respond = (response, status, value) => {
  response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', Connection: 'close' });
  response.end(JSON.stringify(value));
};

export function createMaxRelay({ secret, fetchImpl = fetch } = {}) {
  if (!/^[a-zA-Z0-9_-]{32,256}$/.test(secret || '')) throw new Error('MAX_WEBHOOK_SECRET must contain 32–256 permitted characters');
  const expected = digest(secret);
  const server = createServer(async (request, response) => {
    if (request.method === 'GET' && request.url === '/health') return respond(response, 200, { ok: true, service: 'prioritet-max-relay' });
    if (request.url !== '/webhooks/max') return respond(response, 404, { error: 'Not found' });
    if (request.method !== 'POST') return respond(response, 405, { error: 'POST required' });
    const supplied = request.headers['x-max-bot-api-secret'];
    if (typeof supplied !== 'string' || !timingSafeEqual(digest(supplied), expected)) return respond(response, 403, { error: 'Forbidden' });
    if (!request.headers['content-type']?.toLowerCase().startsWith('application/json')) return respond(response, 415, { error: 'JSON required' });
    if (Number(request.headers['content-length']) > bodyLimit) return respond(response, 413, { error: 'Request too large' });
    try {
      const chunks = [];
      let size = 0;
      for await (const chunk of request.iterator({ destroyOnReturn: false })) {
        size += chunk.length;
        if (size > bodyLimit) return respond(response, 413, { error: 'Request too large' });
        chunks.push(chunk);
      }
      if (!size) return respond(response, 400, { error: 'Empty request' });
      const body = Buffer.concat(chunks);
      try { JSON.parse(body.toString('utf8')); } catch { return respond(response, 400, { error: 'Invalid JSON' }); }
      const result = await fetchImpl(upstream, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Max-Bot-Api-Secret': secret },
        body,
        redirect: 'manual',
        signal: AbortSignal.timeout(20000),
      });
      if (result.status >= 300 && result.status < 400 || !result.headers.get('Content-Type')?.includes('application/json')) return respond(response, 502, { error: 'Invalid service response' });
      const text = await result.text();
      try { JSON.parse(text); } catch { return respond(response, 502, { error: 'Invalid service response' }); }
      response.writeHead(result.status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', Connection: 'close' });
      response.end(text);
    } catch {
      respond(response, 503, { error: 'Webhook temporarily unavailable' });
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
  const server = createMaxRelay({ secret: process.env.MAX_WEBHOOK_SECRET });
  server.listen(port, '127.0.0.1', () => console.log(`MAX webhook relay listening on 127.0.0.1:${port}`));
}
