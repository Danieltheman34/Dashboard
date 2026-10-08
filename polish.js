// ============================================================
// polish.js — shared look + motion for every dashboard page.
// Loaded by topbar.js. Adds:
//   • Instrument Serif + shared classes: .dx-eyebrow, .dx-title, .dx-sec
//   • page fade between pages (View Transitions) and cards rising in
//   • bars filling, chart columns growing, rings sweeping on first load
//   • hero numbers counting up from 0 (see COUNT below)
// The intro effects only run during the first ~1.6 s after a page
// opens, so later re-renders (logging a meal, adding water) stay instant.
// ============================================================
(function () {
  'use strict';
  if (window.__dxPolish) return;
  window.__dxPolish = true;

  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  if (!reduce) root.classList.add('dx-intro');

  if (!document.querySelector('link[href*="Instrument+Serif"]')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap';
    document.head.appendChild(l);
  }

  const EASE = 'cubic-bezier(0.22,1,0.36,1)';
  const CARDS = '.tile, .dx-today, .fu-card, .fu-snap, .fu-tools, .tr-card, .wt-card, .sv-card, .po-card, .card, .hero, .panel, .nw-card';
  const css = `
    :root { --dx-serif: 'Instrument Serif', 'Iowan Old Style', Georgia, serif; }
    @view-transition { navigation: auto; }
    ::view-transition-old(root) { animation: dxOut 0.18s ease-in both; }
    ::view-transition-new(root) { animation: dxIn 0.32s ${EASE} both; }
    @keyframes dxOut { to { opacity: 0; } }
    @keyframes dxIn { from { opacity: 0; } }
    @keyframes dxRise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
    @keyframes dxGrowX { from { transform: scaleX(0); } }
    @keyframes dxGrowY { from { transform: scaleY(0); } }

    html.dx-intro :is(${CARDS}) { animation: dxRise 0.6s ${EASE} both; }
    ${Array.from({ length: 10 }, (_, i) => `html.dx-intro :is(${CARDS}):nth-child(${i + 2}) { animation-delay: ${(i + 1) * 0.05}s; }`).join('\n    ')}
    html.dx-intro :is(.fu-fill, .fu-mbar i, .fill, .bar-fill, .dx-bar i, .gm-bar i) { transform-origin: left center; animation: dxGrowX 1.1s ${EASE} 0.15s both; }
    html.dx-intro .bars > * { transform-origin: center bottom; animation: dxGrowY 0.9s ${EASE} both; }
    ${Array.from({ length: 14 }, (_, i) => `html.dx-intro .bars > *:nth-child(${i + 1}) { animation-delay: ${0.15 + i * 0.035}s; }`).join('\n    ')}

    /* Shared type: small mono eyebrow, big serif title, numbered section rule. */
    .dx-eyebrow { font-family: ui-monospace, 'SF Mono', Menlo, monospace; font-size: 10.5px; letter-spacing: 0.24em; text-transform: uppercase; color: rgba(239,233,223,0.55); }
    .dx-title { font-family: var(--dx-serif); font-weight: 400; font-size: 44px; line-height: 1.02; letter-spacing: -0.01em; color: #EFE9DF; margin: 6px 0 0; -webkit-text-fill-color: currentColor; background: none; }
    .dx-title em { font-style: italic; color: rgba(239,233,223,0.6); }
    .dx-sec { display: flex; align-items: center; gap: 12px; margin: 30px 0 14px; }
    .dx-sec i { font-family: var(--dx-serif); font-style: italic; font-size: 17px; color: rgba(239,233,223,0.55); }
    .dx-sec span { font-family: ui-monospace, 'SF Mono', Menlo, monospace; font-size: 10.5px; letter-spacing: 0.24em; text-transform: uppercase; color: rgba(239,233,223,0.55); }
    .dx-sec::after { content: ''; flex: 1; height: 1px; background: linear-gradient(90deg, rgba(255,255,255,0.10), transparent); }
    /* Page titles everywhere → serif. */
    h1.dash-title { font-family: var(--dx-serif) !important; font-weight: 400 !important; font-size: 44px !important; line-height: 1.02 !important; letter-spacing: -0.01em !important;
      background: none !important; -webkit-text-fill-color: #EFE9DF !important; color: #EFE9DF !important; }
    @media (max-width: 480px) { h1.dash-title { font-size: 38px !important; } }
    .po-title { font-family: var(--dx-serif); font-weight: 400 !important; font-size: 30px !important; letter-spacing: -0.005em !important; }
    .title h1 { font-family: var(--dx-serif) !important; font-weight: 400 !important; font-size: 30px !important; }
    .dx-page-head { margin: 4px 0 22px; }

    /* Numbered section rules (·01, ·02 …) like the Food page. */
    body { counter-reset: dxs; }
    .wt-divider, .section-title { counter-increment: dxs; display: flex !important; align-items: center; gap: 12px !important; }
    .wt-divider::before, .section-title::before { content: '·' counter(dxs, decimal-leading-zero) !important; flex: none !important; width: auto !important; height: auto !important;
      background: none !important; opacity: 1 !important; font-family: var(--dx-serif); font-style: italic; font-size: 17px; letter-spacing: 0; text-transform: none; color: rgba(239,233,223,0.55); }
    .wt-divider::after, .section-title::after { content: '' !important; flex: 1 !important; height: 1px !important; background: linear-gradient(90deg, rgba(255,255,255,0.10), transparent) !important; }
    .wt-divider span { font-family: ui-monospace, 'SF Mono', Menlo, monospace !important; font-size: 10.5px !important; letter-spacing: 0.24em !important; font-weight: 500 !important; color: rgba(239,233,223,0.55) !important; }
    .section-title { font-family: ui-monospace, 'SF Mono', Menlo, monospace !important; font-weight: 500 !important; letter-spacing: 0.24em !important; color: rgba(239,233,223,0.55) !important; }

    @media (prefers-reduced-motion: reduce) { ::view-transition-old(root), ::view-transition-new(root) { animation: none; } }
  `;
  const style = document.createElement('style');
  style.id = 'dx-polish';
  style.textContent = css;
  document.head.appendChild(style);

  // ---------- Count-up ----------
  // Hero numbers on each page. Anything with class "dx-count" counts too.
  const COUNT = ['.dx-count', '#fuLeft', '#fuEaten', '#num', '#wtNum', '.tr-stat-val', '#trWkWorkouts', '.bm-big', '#lnNum', '.ring-num', '.big-num'];
  const NUM = /^(\D*?)(\d[\d,]*(?:\.\d+)?)(.*)$/s;
  function countUp(el) {
    if (el.dataset.dxCounted) return;
    // Only plain text (sleep's "7h 32m" has markup — count the first number only when it's simple).
    if (el.children.length && !el.querySelector('small')) return;
    const html = el.innerHTML, m = el.textContent.trim().match(NUM);
    if (!m) return;
    const raw = m[2], to = parseFloat(raw.replace(/,/g, ''));
    if (!isFinite(to) || to === 0) return;
    el.dataset.dxCounted = '1';
    const dec = (raw.split('.')[1] || '').length, commas = raw.includes(',');
    const fmt = (v) => { const s = v.toFixed(dec); return commas ? Number(s).toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec }) : s; };
    // Replace just the first occurrence of the number in the markup.
    const idx = html.indexOf(raw);
    if (idx < 0) return;
    const pre = html.slice(0, idx), post = html.slice(idx + raw.length);
    const dur = 900 + Math.min(500, to > 100 ? 400 : 0), t0 = performance.now();
    let last = '';
    function frame(t) {
      // The page re-rendered this number itself → stop and leave it alone.
      if (last && el.innerHTML !== last) return;
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.innerHTML = last = pre + fmt(to * e) + post;
      if (p < 1) requestAnimationFrame(frame);
      else el.innerHTML = html;
    }
    requestAnimationFrame(frame);
  }
  function runCounts() { document.querySelectorAll(COUNT.join(',')).forEach(countUp); }

  // ---------- Rings sweep in ----------
  function runRings() {
    document.querySelectorAll('.ring-fill, .tr-ring-fill, .day-ring-fill, .dx-ring').forEach((el) => {
      if (el.dataset.dxRing || !el.getTotalLength) return;
      const target = getComputedStyle(el).strokeDashoffset;
      const len = el.getTotalLength();
      if (!len || target === undefined) return;
      el.dataset.dxRing = '1';
      const prev = el.style.transition;
      el.style.transition = 'none';
      el.style.strokeDashoffset = len;
      el.getBoundingClientRect();
      el.style.transition = 'stroke-dashoffset 1.2s ' + EASE;
      el.style.strokeDashoffset = target;
      setTimeout(() => { el.style.transition = prev; }, 1300);
    });
  }

  function addEyebrows() {
    document.querySelectorAll('h1.dash-title, h1.dx-title').forEach((h) => {
      const prev = h.previousElementSibling;
      if ((prev && prev.classList.contains('dx-eyebrow')) || h.dataset.dxDate) return;
      h.dataset.dxDate = '1';
      const e = document.createElement('div');
      e.className = 'dx-eyebrow';
      e.textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
      h.parentNode.insertBefore(e, h);
    });
  }

  function start() {
    addEyebrows();
    if (reduce) return;
    [120, 600, 1400].forEach((ms) => setTimeout(runCounts, ms));
    setTimeout(runRings, 150);
    setTimeout(() => root.classList.remove('dx-intro'), 1700);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
  window.dxCountUp = (el) => { if (el && !reduce) { delete el.dataset.dxCounted; countUp(el); } };
})();
