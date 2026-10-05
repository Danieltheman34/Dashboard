// ============================================================
// GET /api/lyfta?path=/workouts&limit=100&page=1&from=2026-07-01
// Proxies to https://my.lyfta.app/api/v1<path> using the
// LYFTA_API_KEY env var, so the key never ships to the browser.
// Only read-only GET paths are allowed.
// Env vars required on Vercel:
//   LYFTA_API_KEY  (generate at my.lyfta.app/community/api)
// ============================================================
const ALLOWED = ['/workouts', '/workouts/summary', '/exercises', '/exercises/progress'];

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method not allowed' });

  const key = process.env.LYFTA_API_KEY;
  if (!key) return res.status(500).json({ error: 'not configured', detail: 'Add LYFTA_API_KEY in Vercel and redeploy.' });

  const path = (req.query && req.query.path) || '/workouts';
  if (!ALLOWED.includes(path)) return res.status(400).json({ error: 'path not allowed' });

  const fwd = new URLSearchParams();
  for (const [k, v] of Object.entries(req.query || {})) {
    if (k !== 'path') fwd.set(k, String(v));
  }
  const qs = fwd.toString();
  const url = 'https://my.lyfta.app/api/v1' + path + (qs ? '?' + qs : '');

  try {
    const r = await fetch(url, {
      headers: { 'Authorization': 'Bearer ' + key, 'Accept': 'application/json' },
    });
    const text = await r.text();
    res.setHeader('Cache-Control', 'no-store');
    res.status(r.status).setHeader('Content-Type', 'application/json');
    return res.send(text);
  } catch (e) {
    return res.status(500).json({ error: 'proxy fetch failed: ' + (e && e.message ? e.message : String(e)) });
  }
}
