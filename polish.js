// ============================================================
// polish.js — shared look + motion for every dashboard page.
// Loaded by topbar.js. Adds:
//   • Instrument Serif + shared classes: .dx-eyebrow, .dx-title, .dx-sec
//   • page fade between pages (View Transitions) and cards rising in
//   • bars filling, chart columns growing, rings sweeping on first load
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
    @keyframes dxRise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
    @keyframes dxGrowX { from { transform: scaleX(0); } }
    @keyframes dxGrowY { from { transform: scaleY(0); } }

    html.dx-intro :is(${CARDS}) { animation: dxRise 0.45s ${EASE} both; }
    ${Array.from({ length: 10 }, (_, i) => `html.dx-intro :is(${CARDS}):nth-child(${i + 2}) { animation-delay: ${(i + 1) * 0.03}s; }`).join('\n    ')}
    html.dx-intro :is(.fu-fill, .fu-mbar i, .fill, .bar-fill, .dx-bar i, .gm-bar i) { transform-origin: left center; animation: dxGrowX 0.7s ${EASE} 0.1s both; }
    html.dx-intro .bars > * { transform-origin: center bottom; animation: dxGrowY 0.6s ${EASE} both; }
    ${Array.from({ length: 14 }, (_, i) => `html.dx-intro .bars > *:nth-child(${i + 1}) { animation-delay: ${0.1 + i * 0.02}s; }`).join('\n    ')}

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

    /* ===== iPhone accessibility ===== */
    /* Quick taps never wait for double-tap zoom; pinch zoom stays available. */
    html { touch-action: manipulation; -webkit-text-size-adjust: 100%; }
    /* 16px+ inputs stop iOS from zooming in when a field is tapped. */
    #exSelect, #search, #customName, #customMg, #netWorthCurrency, #chatInput, .fu-in, .set-input,
    [id$="Name"]:is(input), [id$="Amount"]:is(input) { font-size: 16px !important; }
    /* Smallest labels → 11px so they stay readable. */
    .td-lbl, .dx-eyebrow, .fu-mono, .fu-wk-lbl, .fu-pill, .fu-link, .tr-stat-label, .po-sub-title, .tr-eyebrow, .po-stat-label,
    .tr-wk-label, .tr-pr, .tr-strip-legend, .wt-legend-item, .po-seg-label, .energy-when, .energy-hint, .section-title, .section-title-text,
    .nw-stat-label, .nw-chart-label, .nw-chart-delta, .nw-donut-sub, .bot-tab-label, .role, .tag, figcaption, .k, .wt-divider span,
    .bm-legend, .tr-dow, .tr-status, .fu-seg button, .wt-comp-label, .wt-comp-window, .wt-locked-label, .tr-lift-1rm small { font-size: 11px !important; }
    /* Bigger touch targets on phones (Apple recommends ~44pt). */
    @media (pointer: coarse) {
      .po-seg-btn, .tr-seg button, .fu-seg button, .seg button, .seg-toggle button, .tr-dv-open, .tr-more,
      #wtEditBtn, #fuTipDone, #fuToastUndo, .copy, #keyToggle, .fin-back-btn, [id$="AddBtn"] { min-height: 40px; }
      #fuGoalsBtn, #goalLink, .fu-link, #fuTipDone, #fuToastUndo { position: relative; }
      #fuGoalsBtn::after, #goalLink::after, #fuTipDone::after, #fuToastUndo::after { content: ''; position: absolute; inset: -14px -8px; }
      [id$="AddBtn"], #keyToggle { min-width: 44px; }
    }
    /* Clear focus ring for keyboard / Switch Control users. */
    :focus-visible { outline: 2px solid rgba(239,233,223,0.85) !important; outline-offset: 2px; border-radius: 8px; }

    @media (prefers-reduced-motion: reduce) { ::view-transition-old(root), ::view-transition-new(root) { animation: none; } }
  `;
  const style = document.createElement('style');
  style.id = 'dx-polish';
  style.textContent = css;
  document.head.appendChild(style);

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
      el.style.transition = 'stroke-dashoffset 0.8s ' + EASE;
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
    setTimeout(runRings, 150);
    setTimeout(() => root.classList.remove('dx-intro'), 1700);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
  document.addEventListener('touchstart', (e) => {
    const el = e.target && e.target.closest && e.target.closest('input, select, textarea');
    if (el && parseFloat(getComputedStyle(el).fontSize) < 16) el.style.fontSize = '16px';
  }, { passive: true, capture: true });

  // ---------- Home-screen app gestures ----------
  // Installed to the home screen, iOS drops Safari's pull-to-refresh and
  // swipe-back. Pull down at the top to reload; swipe in from the left
  // edge to go back.
  const standalone = navigator.standalone || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
  if (standalone && 'ontouchstart' in window) {
    const ptr = document.createElement('div');
    ptr.setAttribute('aria-hidden', 'true');
    ptr.style.cssText = 'position:fixed;left:50%;top:calc(env(safe-area-inset-top) + 8px);z-index:200;width:36px;height:36px;margin-left:-18px;border-radius:50%;'
      + 'background:rgba(30,30,32,0.95);border:1px solid rgba(255,255,255,0.12);display:flex;align-items:center;justify-content:center;color:#EFE9DF;'
      + 'font:600 18px -apple-system,sans-serif;opacity:0;transform:translateY(-60px);transition:opacity .15s;pointer-events:none';
    ptr.textContent = '↻';
    let sy = null, sx = null, pull = 0, edge = false;
    const locked = () => document.body.style.overflow === 'hidden' || document.documentElement.style.overflow === 'hidden';
    document.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1 || locked()) { sy = null; return; }
      const t = e.touches[0];
      sx = t.clientX; sy = t.clientY; pull = 0;
      edge = sx < 22 && history.length > 1;
      if (!ptr.parentNode && document.body) document.body.appendChild(ptr);
    }, { passive: true });
    document.addEventListener('touchmove', (e) => {
      if (sy == null) return;
      const t = e.touches[0], dy = t.clientY - sy;
      if (!edge && window.scrollY <= 0 && dy > 0) {
        pull = Math.min(120, dy * 0.5);
        ptr.style.opacity = String(Math.min(1, pull / 60));
        ptr.style.transform = 'translateY(' + (pull - 60) + 'px) rotate(' + pull * 3 + 'deg)';
      }
    }, { passive: true });
    document.addEventListener('touchend', (e) => {
      if (sy == null) return;
      const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
      if (edge && dx > 80 && Math.abs(dy) < 50) { history.back(); }
      else if (pull >= 60) { ptr.style.transform = 'translateY(0) rotate(360deg)'; ptr.style.transition = 'transform .5s linear'; setTimeout(() => location.reload(), 150); return; }
      ptr.style.opacity = '0'; ptr.style.transform = 'translateY(-60px)';
      sy = null; edge = false;
    }, { passive: true });
  }

})();
