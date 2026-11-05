const endpoint = 'https://prioritet-leads-20261105.eggetsevich.chatgpt.site/webhooks/max';
const limit = 16384;
const reply = (error, status, headers = {}) => Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store', ...headers } });

// Receive MAX on the website's domain. The lead service remains responsible
// for authenticating the webhook, storing subscriptions and sending replies.
export async function onRequest({ request }) {
  if (request.method !== 'POST') return reply('Method not allowed', 405, { Allow: 'POST' });
  const secret = request.headers.get('X-Max-Bot-Api-Secret');
  if (!/^[a-zA-Z0-9_-]{5,256}$/.test(secret || '')) return reply('Forbidden', 403);
  if (Number(request.headers.get('Content-Length')) > limit) return reply('Request too large', 413);
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) return reply('JSON required', 415);

  try {
    const reader = request.body?.getReader();
    if (!reader) return reply('Empty request', 400);
    const chunks = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); return reply('Request too large', 413); }
      chunks.push(value);
    }
    const body = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Max-Bot-Api-Secret': secret },
      body,
      redirect: 'manual',
      signal: AbortSignal.timeout(20000),
    });
    // Only acknowledge a callback after the service has actually accepted it.
    if (upstream.status >= 300 && upstream.status < 400 || !upstream.headers.get('Content-Type')?.includes('application/json')) return reply('Invalid service response', 502);
    return new Response(upstream.body, { status: upstream.status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  } catch {
    return reply('Webhook temporarily unavailable', 503);
  }
}
