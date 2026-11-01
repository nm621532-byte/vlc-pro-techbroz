/* VLC Pro — Theme & Colour (Tech Bro Z). Runs in <head> BEFORE first paint so there is no colour flash.
   Everything is saved on this phone only (localStorage "vlc-settings"); nothing is sent anywhere. */
(function () {
  'use strict';
  // The 10 accent colours (id, name shown in the app, hex)
  var ACCENTS = [
    { id: 'orange',   name: 'VLC Orange', hex: '#ff8800' },
    { id: 'red',      name: 'Red',        hex: '#ef4444' },
    { id: 'pink',     name: 'Pink',       hex: '#ec4899' },
    { id: 'purple',   name: 'Purple',     hex: '#a855f7' },
    { id: 'indigo',   name: 'Indigo',     hex: '#5b6cff' },
    { id: 'sky',      name: 'Sky Blue',   hex: '#0ea5e9' },
    { id: 'teal',     name: 'Teal',       hex: '#14b8a6' },
    { id: 'green',    name: 'Green',      hex: '#22c55e' },
    { id: 'amber',    name: 'Amber',      hex: '#fbbf24' },
    { id: 'rosegold', name: 'Rose Gold',  hex: '#b76e79' }
  ];
  var MODES = ['dark', 'light', 'auto'], STYLES = ['glass', 'classic'];
  var DARK_TXT = '#16120a', WHITE = '#ffffff';

  /* ---- colour maths (WCAG 2 contrast) ---- */
  function rgb(h) { h = h.replace('#', ''); return [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }
  function hex(c) { return '#' + c.map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }
  function mix(a, b, t) { var A = rgb(a), B = rgb(b); return hex(A.map(function (v, i) { return v + (B[i] - v) * t; })); }
  function lum(h) { var c = rgb(h).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }

  // For one accent + theme, work out every colour the CSS needs.
  function palette(accentHex, theme) {
    // 1) button fill + text on it: white text if it can reach 3:1 by deepening the colour a little (≤15 %),
    //    otherwise dark text (e.g. Amber) which then has ≥ 4.5:1.
    var btn = accentHex, on = WHITE, t = 0;
    while (contrast(mix(accentHex, '#000000', t), WHITE) < 3 && t <= 0.15) t += 0.01;
    if (t <= 0.15) { btn = mix(accentHex, '#000000', t); on = WHITE; }
    else { btn = accentHex; on = DARK_TXT; }
    // 2) accent used as text / icon on the page background: ≥ 4.5:1 against the worst background of that theme
    var worst = theme === 'light' ? '#ffffff' : '#2a2a2a', toward = theme === 'light' ? '#000000' : '#ffffff', ink = accentHex, k = 0;
    while (contrast(ink, worst) < 4.5 && k < 0.9) { k += 0.02; ink = mix(accentHex, toward, k); }
    return { acc: accentHex, btn: btn, on: on, ink: ink };
  }

  function pick(list, v, def) { return list.indexOf(v) >= 0 ? v : def; }
  function accentOf(id) { for (var i = 0; i < ACCENTS.length; i++) if (ACCENTS[i].id === id) return ACCENTS[i]; return ACCENTS[0]; }
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;

  // settings: saved object; params: URLSearchParams (only whitelisted display values are accepted)
  function resolve(settings, params) {
    settings = settings || {};
    var p = function (k) { return params && params.has(k) ? params.get(k) : null; };
    var style = pick(STYLES, p('style'), pick(STYLES, settings.style, 'glass'));
    var mode = pick(MODES, p('theme'), pick(MODES, settings.theme, 'dark'));
    var accent = accentOf(ACCENTS.some(function (a) { return a.id === p('accent'); }) ? p('accent') : settings.accent).id;
    var theme = mode === 'auto' ? (mq && mq.matches ? 'light' : 'dark') : mode;
    return { style: style, mode: mode, theme: theme, accent: accent };
  }

  function apply(settings, params) {
    var r = resolve(settings, params), el = document.documentElement, a = accentOf(r.accent), pal = palette(a.hex, r.theme);
    el.dataset.style = r.style; el.dataset.theme = r.theme; el.dataset.themeMode = r.mode; el.dataset.accent = a.id;
    var st = el.style;
    st.setProperty('--acc', pal.acc); st.setProperty('--acc-btn', pal.btn); st.setProperty('--on-acc', pal.on); st.setProperty('--acc-ink', pal.ink);
    var bg = r.theme === 'light' ? (r.style === 'glass' ? '#e9e7f2' : '#f4f4f6') : (r.style === 'glass' ? '#0b0b10' : '#131313');
    var tc = mix(bg, a.hex, 0.14);
    var meta = document.querySelector('meta[name=theme-color]');
    if (meta) meta.setAttribute('content', tc);
    r.palette = pal; r.themeColor = tc; r.hex = a.hex; r.name = a.name;
    return r;
  }

  window.VLCTheme = { ACCENTS: ACCENTS, MODES: MODES, STYLES: STYLES, palette: palette, contrast: contrast, resolve: resolve, apply: apply, mq: mq };

  // First paint: saved settings + whitelisted URL display options
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem('vlc-settings') || '{}') || {}; } catch (e) { saved = {}; }
  var params = new URLSearchParams(location.search);
  if (!params.has('style') && !params.has('theme') && !params.has('accent')) params = null;
  else { var only = new URLSearchParams(); ['style', 'theme', 'accent'].forEach(function (k) { if (params.has(k)) only.set(k, params.get(k)); }); params = only; }
  apply(saved, params);
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) document.documentElement.classList.add('reduce-motion');
})();
