/* VLC Pro — native.js (Android app only)
   The "native" media source for the VLC Pro Android APK. Inside the app shell (Capacitor) it asks once for the
   phone's video/audio permission, then reads the phone's media library (Android MediaStore) and shows every
   video and song grouped by folder, exactly like real VLC. It rescans on every app open, when you come back
   to the app, and on pull-to-refresh. Files are never copied or uploaded: the app plays them straight from the
   phone through a private local address that only this app's own screen can open. In a normal browser this
   file does nothing. */
(() => {
  'use strict';
  const C = window.Capacitor;
  const isApp = !!(C && C.isNativePlatform && C.isNativePlatform());
  const MS = isApp && C.Plugins && C.Plugins.VlcMedia;
  window.VLCNative = { active: false };
  if (!MS) return;
  document.documentElement.classList.add('native-app');

  // Android WebView has no screen.orientation.lock — route it to the native VlcMedia.setOrientation
  if (isApp && MS && MS.setOrientation) {
    try {
      const so = screen.orientation || {};
      const nativeLock = (t) => MS.setOrientation({ mode: String(t || 'auto').startsWith('landscape') ? 'landscape' : String(t || '').startsWith('portrait') ? 'portrait' : 'auto' }).then(() => undefined);
      const nativeUnlock = () => { MS.setOrientation({ mode: 'auto' }); };
      so.lock = (t) => nativeLock(t);
      so.unlock = nativeUnlock;
      window.VLCNativeOrientation = { lock: nativeLock, unlock: nativeUnlock };
      document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) nativeUnlock(); });
    } catch (e) {}
  }
  const HKEY = 'vlc-native-hidden';
  const hidden = () => new Set(JSON.parse(localStorage.getItem(HKEY) || '[]'));
  const hide = nid => { const h = hidden(); h.add(nid); localStorage.setItem(HKEY, JSON.stringify([...h])); };
  const unhide = nid => { const h = hidden(); h.delete(nid); localStorage.setItem(HKEY, JSON.stringify([...h])); };
  const stripExt = n => String(n || '').replace(/\.[^.]{1,5}$/, '');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let busy = null, lastScan = 0, permState = 'unknown';

  /* ---------- first-launch permission screen ---------- */
  const CONE = '<svg viewBox="0 0 32 32" width="88" height="88" aria-hidden="true"><path d="M13 3h6l6 22H7z" fill="#ff8800"/><path d="M11.6 11h8.8l1.2 4.4H10.4zM9.5 19h13l1.1 4H8.4z" fill="#fff"/><rect x="4" y="25" width="24" height="4" rx="1.5" fill="#ff8800"/></svg>';
  function gate(state) {
    let g = document.getElementById('permGate');
    if (!g) { g = document.createElement('div'); g.id = 'permGate'; g.setAttribute('role', 'dialog'); g.setAttribute('aria-modal', 'true'); document.body.appendChild(g); }
    const denied = state === 'denied';
    g.innerHTML = `<div class="pg-card">${CONE}
      <h1>VLC Pro</h1>
      <h2>${denied ? 'Permission is turned off' : 'Allow access to show all your videos'}</h2>
      <p>${denied
        ? 'Media access was denied. Open Settings → <b>Permissions</b> → <b>Photos and videos</b> and <b>Music and audio</b> → <b>Allow</b>. Then come back here and your videos will appear automatically.'
        : 'VLC Pro will show every video and song on your phone, sorted by folder — DCIM, Camera, Movies, WhatsApp Video, Downloads… No need to add them one by one.'}</p>
      <ul><li>🔒 Everything stays on your phone</li><li>🚫 Nothing is uploaded — no internet needed</li><li>👀 Only videos and audio are read</li></ul>
      <button class="pg-btn" id="pgMain">${denied ? 'Open Settings' : 'Allow'}</button>
      <button class="pg-skip" id="pgSkip">Not now — I'll pick videos myself</button></div>`;
    g.classList.remove('hidden');
    document.getElementById('pgMain').onclick = async () => {
      if (denied) { try { await MS.openSettings(); } catch (e) {} return; }
      const r = await ask();
      if (r === 'granted' || r === 'limited') { closeGate(); scan({ toast: true }); }
      else gate('denied');
    };
    document.getElementById('pgSkip').onclick = () => { localStorage.setItem('vlc-native-skip', '1'); closeGate(); };
  }
  function closeGate() { const g = document.getElementById('permGate'); if (g) g.classList.add('hidden'); }
  async function ask() { try { const r = await MS.requestPerm(); permState = r.media; return r.media; } catch (e) { return 'denied'; } }
  async function check() { try { const r = await MS.checkPerm(); permState = r.media; return r.media; } catch (e) { return 'denied'; } }

  /* ---------- scan + merge into the library ---------- */
  async function scan(o = {}) {
    if (busy) return busy;
    busy = (async () => {
      const V = window.VLC; if (!V) return null;
      const st = await check();
      if (st !== 'granted' && st !== 'limited') { if (o.ask) gate(st === 'denied' ? 'denied' : 'prompt'); return null; }
      V.S.scanning = { name: 'phone', found: 0 }; V.render();
      let r; try { r = await MS.scan(); } catch (e) { V.S.scanning = null; V.render(); V.toast("Couldn't scan the phone: " + (e && e.message || e), 4000); return null; }
      const items = (r && r.items) || [];
      const hid = hidden(); const seen = new Set(); let added = 0, removed = 0; const hadNative = V.S.media.some(x => x.native);
      for (const it of items) {
        if (hid.has(it.nid)) continue;
        const id = 'n_' + it.nid.replace(':', '_'); seen.add(id);
        let m = V.byId(id);
        const meta = { file: it.name, kind: it.kind, size: it.size, mime: it.mime, duration: it.duration || 0, w: it.w || 0, h: it.h || 0,
          folder: it.folder, rel: (it.path || '') + it.name, url: it.src, thumbSrc: it.thumbSrc, nid: it.nid, lm: it.date, native: true };
        if (!m) {
          m = Object.assign({ id, name: stripExt(it.kind === 'audio' && it.title ? it.title : it.name), added: it.date || Date.now(), pos: 0, lastPlayed: 0, fav: false,
            hasBlob: false, sub: null, subName: null, src: null }, meta);
          V.S.media.push(m); added++;
        } else Object.assign(m, meta);
        V.thumbURL.set(id, it.thumbSrc);
        V.saveMedia(m);
      }
      for (const m of V.S.media.filter(x => x.native && !seen.has(x.id))) {      // deleted / moved on the phone
        if (V.P.cur === m) V.stopPlayback();
        V.S.media = V.S.media.filter(x => x !== m); V.DB.del('media', m.id).catch(() => {}); removed++;
      }
      V.S.scanning = null; lastScan = Date.now(); V.render();
      const nv = items.filter(x => x.kind === 'video').length, na = items.length - nv;
      if (o.toast || !hadNative || (added && hadNative) || removed) V.toast(`📂 Phone: ${nv} videos, ${na} audio` + (added && hadNative ? ` • ${added} new` : '') + (removed ? ` • ${removed} removed` : ''), 3000);
      window.VLCNative.last = { videos: nv, audio: na, added, removed, at: lastScan };
      return window.VLCNative.last;
    })();
    try { return await busy; } finally { busy = null; }
  }

  /* ---------- pull-to-refresh ---------- */
  function pullToRefresh() {
    const content = document.getElementById('content'); if (!content) return;
    const ind = document.createElement('div'); ind.id = 'ptr'; ind.innerHTML = '<span></span>'; document.body.appendChild(ind);
    let y0 = null, dy = 0;
    content.addEventListener('touchstart', e => { y0 = (content.scrollTop <= 0 && e.touches.length === 1) ? e.touches[0].clientY : null; dy = 0; }, { passive: true });
    content.addEventListener('touchmove', e => {
      if (y0 === null) return; dy = e.touches[0].clientY - y0;
      if (dy > 0) { const p = Math.min(dy / 90, 1); ind.style.opacity = p; ind.style.transform = `translate(-50%, ${Math.min(dy, 110) * 0.6}px) rotate(${dy * 3}deg)`; ind.classList.toggle('ready', p >= 1); }
    }, { passive: true });
    const end = async () => {
      if (y0 === null) return; y0 = null;
      if (dy >= 90) { ind.classList.add('spin'); await scan({ toast: true, ask: true }); }
      ind.classList.remove('spin', 'ready'); ind.style.opacity = 0; ind.style.transform = 'translate(-50%, 0)';
    };
    content.addEventListener('touchend', end); content.addEventListener('touchcancel', end);
  }

  async function start() {
    const V = window.VLC; if (!V) return setTimeout(start, 50);
    window.VLCNative.active = true;
    pullToRefresh();
    const st = await check();
    if (st === 'granted' || st === 'limited') scan({ first: true });
    else if (!localStorage.getItem('vlc-native-skip') || st === 'prompt') gate(st === 'denied' ? 'denied' : 'prompt');
    document.addEventListener('visibilitychange', async () => {        // back from Settings / camera → rescan
      if (document.visibilityState !== 'visible') return;
      const s = await check();
      if (s === 'granted' || s === 'limited') { closeGate(); if (Date.now() - lastScan > 4000) scan(); }
    });
  }
  Object.assign(window.VLCNative, { scan, ask, check, hide, unhide, gate, get perm() { return permState; } });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
