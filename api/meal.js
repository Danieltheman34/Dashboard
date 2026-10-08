// ============================================================
// /api/meal
//   GET  → { configured: true|false }
//   POST → { system, content, schema, effort } → Claude's JSON answer
// Used by the Food page (health.html) to read meal photos, typed
// meals and barcode digits, so phones don't need their own API key.
// Env vars:
//   ANTHROPIC_API_KEY  (console.anthropic.com → API keys)
// Only requests from the dashboard's own pages are accepted.
// ============================================================
export const config = { maxDuration: 60 };

const MODEL = 'claude-opus-5-5';
const MAX_BODY = 4 * 1024 * 1024;

function sameOrigin(req) {
  const origin = req.headers.origin || req.headers.referer || '';
  try { return new URL(origin).host === req.headers.host; } catch { return false; }
}

export default async function handler(req, res) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (req.method === 'GET') return res.status(200).json({ configured: !!key });
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  if (!key) return res.status(501).json({ error: 'not_configured' });
  if (!sameOrigin(req)) return res.status(403).json({ error: 'forbidden' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
  if (!body || !Array.isArray(body.content) || !body.schema || typeof body.system !== 'string') {
    return res.status(400).json({ error: 'bad request' });
  }
  if (JSON.stringify(body).length > MAX_BODY) return res.status(413).json({ error: 'Photo too large' });
  // Only text and images — nothing else gets forwarded.
  const content = body.content.filter((b) => b && (b.type === 'text' || b.type === 'image')).slice(0, 4);
  const effort = ['low', 'medium', 'high'].includes(body.effort) ? body.effort : 'medium';

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01',
        'anthropic-beta': 'server-side-fallback-2026-07-01',
      },
      body: JSON.stringify({
        model: MODEL, max_tokens: 16000, system: body.system.slice(0, 8000),
        output_config: { effort, format: { type: 'json_schema', schema: body.schema } },
        fallbacks: 'default',
        messages: [{ role: 'user', content }],
      }),
    });
    const j = await r.json().catch(() => ({}));
    return res.status(r.status).json(j);
  } catch (e) {
    return res.status(502).json({ error: { message: e && e.message ? e.message : String(e) } });
  }
}
