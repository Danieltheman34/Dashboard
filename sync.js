// =============================================================
// Shared cloud-sync helper for the dashboard.
// Each page calls initCloudSync({...}) once with its config:
//   appKey         — string row key in the public.app_state table
//   syncedKeys     — exact localStorage keys to mirror
//   syncedPrefixes — localStorage key prefixes to mirror (e.g. 'goals:')
//   onApplied      — optional callback after remote state has been applied
//
// Requires:
//   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
//   <script src="sync.js" defer></script>
// =============================================================
(function () {
  'use strict';

  // Prefer Vercel env vars (served via /api/config → window.DASH_*),
  // otherwise fall back to these defaults.
  const SUPABASE_URL = (typeof window !== 'undefined' && window.DASH_SUPABASE_URL) || 'https://srajryooffirbroltjmg.supabase.co';
  const SUPABASE_KEY = (typeof window !== 'undefined' && window.DASH_SUPABASE_KEY) || 'sb_publishable_5142ZwTLF_DkSVRzciNuRA_bHwRAu4c';

  window.initCloudSync = function (config) {
    const appKey = config && config.appKey;
    const syncedKeys = (config && config.syncedKeys) || [];
    const syncedPrefixes = (config && config.syncedPrefixes) || [];
    const onApplied = config && config.onApplied;
    if (!appKey) return;
    if (!window.supabase) return;
    if (!SUPABASE_URL || !SUPABASE_KEY) return;
    if (SUPABASE_URL.indexOf('PASTE-') === 0 || SUPABASE_KEY.indexOf('PASTE-') === 0) return;

    let supa = null;
    let pushTimer = null;
    let suppressSync = false;
    let lastSyncedJson = null;
    // Nothing is uploaded until the first cloud pull has been merged in; an
    // early upload would be followed by that (older) pull overwriting it.
    let ready = false;

    // Keys changed on this device that the cloud hasn't confirmed yet. They win
    // over anything pulled from the cloud, so a save made while a pull is in
    // flight (or before the page finished loading) is never overwritten.
    // Persisted so an unsent change survives a reload.
    const DIRTY_KEY = 'sync_dirty:' + appKey;
    let dirty = {};
    try { dirty = JSON.parse(localStorage.getItem(DIRTY_KEY)) || {}; } catch (e) { dirty = {}; }
    let dirtySeq = Date.now();
    function saveDirty() { try { origSet(DIRTY_KEY, JSON.stringify(dirty)); } catch (e) {} }
    function markDirty(k) { dirty[k] = ++dirtySeq; saveDirty(); }

    function matches(k) {
      if (!k) return false;
      if (syncedKeys.indexOf(k) !== -1) return true;
      for (let i = 0; i < syncedPrefixes.length; i++) {
        if (k.indexOf(syncedPrefixes[i]) === 0) return true;
      }
      return false;
    }
    function listAllKeys() {
      const out = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (matches(k)) out.push(k);
      }
      return out;
    }
    function collect() {
      const out = {};
      for (const k of listAllKeys()) {
        const v = localStorage.getItem(k);
        if (v == null) continue;
        try { out[k] = JSON.parse(v); } catch (e) { out[k] = v; }
      }
      return out;
    }

    var origSet = localStorage.setItem.bind(localStorage);
    var origRemove = localStorage.removeItem.bind(localStorage);
    localStorage.setItem = function (k, v) {
      origSet(k, v);
      try { if (!suppressSync && matches(k)) { markDirty(k); schedulePush(); } } catch (e) {}
    };
    localStorage.removeItem = function (k) {
      origRemove(k);
      try { if (!suppressSync && matches(k)) { markDirty(k); schedulePush(); } } catch (e) {}
    };

    function applyRemote(remote) {
      if (!remote || typeof remote !== 'object') return false;
      suppressSync = true;
      let changed = false;
      try {
        for (const k of Object.keys(remote)) {
          if (!matches(k) || dirty[k]) continue;   // unsent local change wins
          const incoming = JSON.stringify(remote[k]);
          const local = localStorage.getItem(k);
          if (local !== incoming) {
            try { origSet(k, incoming); changed = true; } catch (e) {}
          }
        }
        for (const k of listAllKeys()) {
          if (!(k in remote) && !dirty[k]) {
            try { origRemove(k); changed = true; } catch (e) {}
          }
        }
      } finally { suppressSync = false; }
      if (changed && typeof onApplied === 'function') {
        try { onApplied(); } catch (e) {}
      }
      // Local changes the cloud doesn't have yet → send the merged state up.
      if (Object.keys(dirty).length) schedulePush();
      return changed;
    }

    async function pushNow() {
      if (!supa || !ready) return;
      const state = collect();
      const json = JSON.stringify(state);
      const sent = Object.assign({}, dirty);
      if (json === lastSyncedJson) { clearSent(sent); return; }
      try {
        const { error } = await supa.from('app_state').upsert(
          { key: appKey, data: state, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        );
        if (!error) { lastSyncedJson = json; clearSent(sent); }
      } catch (e) {}
    }
    // Confirmed by the cloud → no longer dirty (unless changed again meanwhile).
    function clearSent(sent) {
      let n = 0;
      for (const k in sent) if (dirty[k] === sent[k]) { delete dirty[k]; n++; }
      if (n) saveDirty();
    }
    function schedulePush() {
      clearTimeout(pushTimer);
      pushTimer = setTimeout(pushNow, 250);
    }
    function flushOnUnload() {
      if (!ready) return;  // unsent changes stay marked dirty and go up next visit
      const state = collect();
      const json = JSON.stringify(state);
      if (json === lastSyncedJson) return;
      try {
        fetch(SUPABASE_URL + '/rest/v1/app_state?on_conflict=key', {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': 'Bearer ' + SUPABASE_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates',
          },
          body: JSON.stringify({ key: appKey, data: state, updated_at: new Date().toISOString() }),
          keepalive: true,
        }).catch(() => {});
        lastSyncedJson = json;
      } catch (e) {}
    }

    (async function init() {
      supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      // First pull. If it fails (no signal), retry instead of uploading a partial copy.
      async function firstPull() {
        try {
          const { data, error } = await supa
            .from('app_state').select('data').eq('key', appKey).maybeSingle();
          if (error) throw error;
          if (data && data.data && Object.keys(data.data).length > 0) {
            lastSyncedJson = JSON.stringify(data.data);
            applyRemote(data.data);
            if (Object.keys(dirty).length) lastSyncedJson = null;
          } else if (Object.keys(collect()).length > 0) {
            lastSyncedJson = null;
          }
          ready = true;
          if (Object.keys(dirty).length || lastSyncedJson === null) schedulePush();
        } catch (e) { setTimeout(firstPull, 5000); }
      }
      await firstPull();
      supa.channel('app_state_' + appKey)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'app_state',
          filter: 'key=eq.' + appKey,
        }, (payload) => {
          if (!payload.new || !payload.new.data) return;
          const incoming = JSON.stringify(payload.new.data);
          if (incoming === lastSyncedJson) return;
          lastSyncedJson = incoming;
          applyRemote(payload.new.data);
        })
        .subscribe();
    })();

    window.addEventListener('beforeunload', flushOnUnload);
    window.addEventListener('pagehide', flushOnUnload);
    window.addEventListener('storage', (e) => {
      if (e.key && matches(e.key)) schedulePush();
    });
  };
})();
