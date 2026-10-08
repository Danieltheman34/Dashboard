// ============================================================
// POST /api/sleep
// Body (JSON): { token: "...", samples: "start|end|value\n..." }
//   start/end — ISO 8601 dates (with timezone offset)
//   value     — Apple Health sleep value: In Bed, Asleep, Core, Deep, REM, Awake
// Sent by an iPhone Shortcut that reads Sleep Analysis from Apple
// Health. The token must match 'sleep:token' saved by sleep.html in
// the app_state 'sleep' row. New samples are merged (deduped) into
// the app_state 'sleep_data' row, keeping the last 120 days.
// Env vars (optional; same ones /api/config uses):
//   SUPABASE_URL, SUPABASE_ANON_KEY
// ============================================================
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://srajryooffirbroltjmg.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_5142ZwTLF_DkSVRzciNuRA_bHwRAu4c';
const KEEP_DAYS = 120;

function stageOf(v) {
  const s = String(v || '').toLowerCase();
  if (/in ?bed/.test(s)) return 'inbed';
  if (/awake/.test(s)) return 'awake';
  if (/deep/.test(s)) return 'deep';
  if (/rem/.test(s)) return 'rem';
  if (/core|light/.test(s)) return 'core';
  if (/asleep|sleep|unspecified/.test(s)) return 'asleep';
  return null;
}

async function readRow(key) {
  const r = await fetch(SUPABASE_URL + '/rest/v1/app_state?select=data&key=eq.' + encodeURIComponent(key), {
    headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY },
  });
  if (!r.ok) throw new Error('read ' + key + ' failed: ' + r.status);
  const rows = await r.json();
  return (rows[0] && rows[0].data) || {};
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const token = body && String(body.token || '').trim();
  const raw = body && body.samples;
  if (!token) return res.status(400).json({ error: 'token required' });
  if (!raw) return res.status(400).json({ error: 'samples required' });

  try {
    const settings = await readRow('sleep');
    if (!settings['sleep:token'] || settings['sleep:token'] !== token) {
      return res.status(401).json({ error: 'Wrong token. Copy it again from the Sleep page.' });
    }

    // Shortcuts may send one text block or a list of lines.
    const lines = (Array.isArray(raw) ? raw : String(raw).split(/\r?\n/)).map((l) => String(l).trim()).filter(Boolean);
    const incoming = [];
    let bad = 0;
    for (const line of lines) {
      const [a, b, v] = line.split('|').map((x) => (x || '').trim());
      const start = new Date(a), end = new Date(b), stage = stageOf(v);
      if (isNaN(start) || isNaN(end) || !stage || end <= start) { bad++; continue; }
      incoming.push([a, b, stage]);
    }

    const data = await readRow('sleep_data');
    const map = new Map();
    const cutoff = Date.now() - KEEP_DAYS * 864e5;
    for (const s of (data.samples || []).concat(incoming)) {
      if (new Date(s[1]).getTime() < cutoff) continue;
      map.set(new Date(s[0]).getTime() + '|' + new Date(s[1]).getTime() + '|' + s[2], s);
    }
    const before = (data.samples || []).length;
    const samples = Array.from(map.values()).sort((x, y) => new Date(x[0]) - new Date(y[0]));
    const updated = new Date().toISOString();

    const w = await fetch(SUPABASE_URL + '/rest/v1/app_state?on_conflict=key', {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({ key: 'sleep_data', data: { samples, updated }, updated_at: updated }),
    });
    if (!w.ok) throw new Error('save failed: ' + w.status + ' ' + (await w.text()));

    const added = samples.length - before;
    return res.status(200).json({
      ok: true, received: lines.length, added: Math.max(0, added), skipped: bad,
      message: bad && !incoming.length
        ? 'None of the samples could be read. Make sure the dates use ISO 8601 format.'
        : 'Synced ' + incoming.length + ' sleep samples (' + Math.max(0, added) + ' new).',
    });
  } catch (e) {
    return res.status(500).json({ error: e && e.message ? e.message : String(e) });
  }
}
