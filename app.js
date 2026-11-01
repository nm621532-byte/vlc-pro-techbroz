/* VLC Pro (Tech Bro Z) — Educational project, not affiliated with VideoLAN.
   Everything runs in your browser: videos, thumbnails, playlists and settings are stored
   on your own device (IndexedDB + localStorage). Nothing is uploaded to any server. */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;

/* ---------------- icons (inline SVG) ---------------- */
const P_ = d => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
const I = {
  search: P_('M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z'),
  resume: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6a7 7 0 1 1 2.05 4.95l-1.42 1.42A9 9 0 1 0 13 3z"/><path d="M11 8.5v7l5.5-3.5z"/></svg>`,
  vmore: P_('M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z'),
  back: P_('M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z'),
  close: P_('M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z'),
  play: P_('M8 5v14l11-7z'),
  pause: P_('M6 19h4V5H6v14zm8-14v14h4V5h-4z'),
  clap: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3.3 8.6 18.6 4.5l.75 2.8L4.05 11.4z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/><path d="m7.4 7.3 2.2 2.6M11.5 6.2l2.2 2.6M15.6 5.1l2.2 2.6" stroke="currentColor" stroke-width="1.7"/></svg>`,
  note: P_('M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z'),
  folder: P_('M9.17 6l2 2H20v10H4V6h5.17M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z'),
  plist: P_('M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z'),
  add: P_('M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z'),
  addlist: P_('M14 10H3v2h11v-2zm0-4H3v2h11V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM3 16h7v-2H3v2z'),
  del: P_('M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z'),
  edit: P_('M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z'),
  info: P_('M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z'),
  heart: P_('M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'),
  heartO: P_('M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z'),
  restart: P_('M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z'),
  sort: P_('M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z'),
  grid: P_('M4 11h5V5H4v6zm0 7h5v-6H4v6zm6 0h5v-6h-5v6zm6 0h5v-6h-5v6zm-6-7h5V5h-5v6zm6-6v6h5V5h-5z'),
  listic: P_('M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z'),
  theme: P_('M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.39 5.39 0 0 1-4.4 2.26 5.4 5.4 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z'),
  glass: P_('M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8 0-1.1.2-2.1.6-3 .8 2.8 3.4 5 6.4 5 2.2 0 4.2-1.2 5.3-3 .4.9.7 1.9.7 3 0 3.3-2.7 6-6 6z'),
  history: P_('M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.95 8.95 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z'),
  kb: P_('M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z'),
  storage: P_('M2 20h20v-4H2v4zm2-3h2v2H4v-2zM2 4v4h20V4H2zm4 3H4V5h2v2zm-4 7h20v-4H2v4zm2-3h2v2H4v-2z'),
  bg: P_('M12 3c-4.97 0-9 4.03-9 9v7c0 1.1.9 2 2 2h4v-8H5v-1c0-3.87 3.13-7 7-7s7 3.13 7 7v1h-4v8h4c1.1 0 2-.9 2-2v-7c0-4.97-4.03-9-9-9z'),
  group: P_('M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z'),
  phone: P_('M17 1.01 7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z'),
  shuffle: P_('M10.59 9.17 5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z'),
  repeat: P_('M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z'),
  repeat1: P_('M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z'),
  lock: P_('M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z'),
  unlock: P_('M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h1.9c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z'),
  rotate: P_('M7.11 8.53 5.7 7.11C4.8 8.27 4.24 9.61 4.07 11h2.02c.14-.87.49-1.72 1.02-2.47zM6.09 13H4.07c.17 1.39.72 2.73 1.62 3.89l1.41-1.42c-.52-.75-.87-1.59-1.01-2.47zm1.01 5.32c1.16.9 2.51 1.44 3.9 1.61V17.9c-.87-.15-1.71-.49-2.46-1.03L7.1 18.32zM13 4.07V1L8.45 5.55 13 10V6.09c2.84.48 5 2.94 5 5.91s-2.16 5.43-5 5.91v2.02c3.95-.49 7-3.85 7-7.93s-3.05-7.44-7-7.93z'),
  aspect: P_('M19 12h-2v3h-3v2h5v-5zM7 9h3V7H5v5h2V9zm14-6H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16.01H3V4.99h18v14.02z'),
  full: P_('M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z'),
  pip: P_('M19 11h-8v6h8v-6zm4 8V4.98C23 3.88 22.1 3 21 3H3c-1.1 0-2 .88-2 1.98V19c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zm-2 .02H3V4.97h18v14.05z'),
  camera: P_('M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zM9 2 7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z'),
  cc: P_('M19 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 7H9.5v-.5h-2v3h2V13H11v1c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1zm7 0h-1.5v-.5h-2v3h2V13H18v1c0 .55-.45 1-1 1h-3c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1z'),
  prev: P_('M6 6h2v12H6zm3.5 6 8.5 6V6z'),
  next: P_('M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z'),
  rew10: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/><text x="12" y="16.3" font-size="6.6" font-weight="700" text-anchor="middle" font-family="Roboto,Arial,sans-serif">10</text></svg>`,
  fwd10: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/><text x="12" y="16.3" font-size="6.6" font-weight="700" text-anchor="middle" font-family="Roboto,Arial,sans-serif">10</text></svg>`,
  sun: P_('M20 8.69V4h-4.69L12 .69 8.69 4H4v4.69L.69 12 4 15.31V20h4.69L12 23.31 15.31 20H20v-4.69L23.31 12 20 8.69zM12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z'),
  vol: P_('M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z'),
  timer: P_('M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61 1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42A8.96 8.96 0 0 0 12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9a8.994 8.994 0 0 0 7.03-14.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z'),
  ab: `<svg viewBox="0 0 24 24" aria-hidden="true"><text x="12" y="16" font-size="10.5" font-weight="700" text-anchor="middle" font-family="Roboto,Arial,sans-serif">A-B</text></svg>`,
  eq: P_('M10 20h4V4h-4v16zm-6 0h4v-8H4v8zM16 9v11h4V9h-4z'),
  speed: P_('M20.38 8.57l-1.23 1.85a8 8 0 0 1-.22 7.58H5.07A8 8 0 0 1 15.58 6.85l1.85-1.23A10 10 0 0 0 3.35 19a2 2 0 0 0 1.72 1h13.85a2 2 0 0 0 1.74-1 10 10 0 0 0-.27-10.44zm-9.79 6.84a2 2 0 0 0 2.83 0l5.66-8.49-8.49 5.66a2 2 0 0 0 0 2.83z'),
  boost: P_('M7 2v11h3v9l7-12h-4l4-8z'),
  check: P_('M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z'),
  up: P_('M7.41 15.41 12 10.83l4.59 4.58L18 14l-6-6-6 6z'),
  down: P_('M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z'),
  blank: '<svg viewBox="0 0 24 24"></svg>',
  hmore: P_('M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z'),
};
const CONE = `<svg viewBox="0 0 27 33" aria-hidden="true"><defs><linearGradient id="cg" x1="0" x2="1"><stop offset="0" stop-color="#ff9a1f"/><stop offset=".55" stop-color="#ff8800"/><stop offset="1" stop-color="#e86f00"/></linearGradient></defs><path d="M11.1 1.2h4.8c.5 0 .9.3 1 .8l6.2 23.6H3.9L10.1 2c.1-.5.5-.8 1-.8z" fill="url(#cg)"/><path d="M9.05 9.4h8.9l1.2 4.6H7.85zM6.9 17.6h13.2l1.15 4.4H5.75z" fill="#fff"/><rect x=".6" y="24.6" width="25.8" height="5.4" rx="1.6" fill="url(#cg)"/></svg>`;

/* ---------------- tiny IndexedDB wrapper ---------------- */
const DB = {
  db: null,
  open() {
    return new Promise((res) => {
      if (!('indexedDB' in window)) return res(false);
      const r = indexedDB.open('vlc-clone-techbroz', 2); // DB name kept from v1 so existing libraries survive the rename
      r.onupgradeneeded = () => { const d = r.result, has = n => d.objectStoreNames.contains(n);
        if (!has('media')) d.createObjectStore('media', { keyPath: 'id' }); if (!has('playlists')) d.createObjectStore('playlists', { keyPath: 'id' });
        if (!has('blobs')) d.createObjectStore('blobs'); if (!has('dirs')) d.createObjectStore('dirs', { keyPath: 'id' }); };
      r.onsuccess = () => { this.db = r.result; res(true); };
      r.onerror = () => res(false);
    });
  },
  tx(store, mode, fn) {
    return new Promise((res, rej) => {
      if (!this.db) return mode === 'readonly' ? res(undefined) : rej(new Error('no db'));
      const t = this.db.transaction(store, mode); const q = fn(t.objectStore(store)); let out;
      if (q) q.onsuccess = () => { out = q.result; };
      t.oncomplete = () => res(out); t.onerror = t.onabort = () => rej(t.error || new Error('tx failed'));
    });
  },
  all(s) { return this.tx(s, 'readonly', st => st.getAll()).then(v => v || []); },
  get(s, k) { return this.tx(s, 'readonly', st => st.get(k)); },
  put(s, v, k) { return this.tx(s, 'readwrite', st => k === undefined ? st.put(v) : st.put(v, k)); },
  del(s, k) { return this.tx(s, 'readwrite', st => st.delete(k)); },
  clear(s) { return this.tx(s, 'readwrite', st => st.clear()); },
};

/* ---------------- state ---------------- */
const params = new URLSearchParams(location.search);
const DEF = { style: 'glass', theme: 'dark', view: 'list', sort: 'name', dir: 1, group: true, bgAudio: true, eq: [0, 0, 0, 0, 0], eqPreset: 'Flat', boost: 100, subSize: 18 };
let SET = Object.assign({}, DEF, JSON.parse(localStorage.getItem('vlc-settings') || '{}'));
const saveSet = () => localStorage.setItem('vlc-settings', JSON.stringify(SET));
const SRC = window.VLCSources;
const S = { media: [], playlists: [], dirs: [], scanning: null, nav: 'video', tab: { video: 0, audio: 0 }, folder: null, playlist: null, sub: null, search: null };
const blobCache = new Map(); const thumbURL = new Map();
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const byId = id => S.media.find(m => m.id === id);
function fmt(t) { t = Math.max(0, Math.floor(t || 0)); const h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = t % 60; return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`; }
function res(w, h) { const s = Math.min(w, h); if (!s) return ''; if (s >= 2100) return '4K'; if (s >= 1400) return '1440p'; if (s >= 1000) return '1080p'; if (s >= 700) return '720p'; if (s >= 560) return '576p'; if (s >= 470) return '480p'; if (s >= 350) return '360p'; if (s >= 230) return '240p'; return s + 'p'; }
function size(b) { if (!b) return '0 B'; const u = ['B', 'KB', 'MB', 'GB']; let i = 0; while (b >= 1024 && i < 3) { b /= 1024; i++; } return b.toFixed(i ? 1 : 0) + ' ' + u[i]; }
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
function applyRootAttrs() {
  root.dataset.style = params.get('style') || SET.style;
  root.dataset.theme = params.get('theme') || SET.theme;
  root.classList.toggle('shot', params.has('shot'));
  const glass = root.dataset.style === 'glass', light = root.dataset.theme === 'light';
  $('meta[name=theme-color]').content = light ? '#f4f4f6' : (glass ? '#0b0b10' : '#131313');
  let cs = $('#cueStyle'); if (!cs) { cs = document.createElement('style'); cs.id = 'cueStyle'; document.head.appendChild(cs); }
  cs.textContent = `#subLine{font-size:${SET.subSize}px}`;
}

/* ---------------- toast ---------------- */
let toastT;
function toast(msg, ms = 2600, action, fn) {
  const t = $('#toast'); t.innerHTML = `<span>${esc(msg)}</span>` + (action ? `<button>${esc(action)}</button>` : '');
  t.classList.remove('hidden'); clearTimeout(toastT);
  if (action) t.querySelector('button').onclick = () => { t.classList.add('hidden'); fn(); };
  if (ms) toastT = setTimeout(() => t.classList.add('hidden'), ms);
}

/* ---------------- Android back button closes sheet / player / folder ---------------- */
const layers = [];
function pushLayer(name, close) { layers.push({ name, close }); history.pushState({ vlc: layers.length }, ''); }
function dropLayer(name) { const i = layers.map(l => l.name).lastIndexOf(name); if (i >= 0) layers.splice(i, 1); }
window.addEventListener('popstate', () => { const l = layers.pop(); if (l) l.close(true); });

/* ---------------- media probing: duration, resolution, real thumbnail ---------------- */
function probe(file, kind) {
  return new Promise(resolve => {
    const el = document.createElement(kind === 'audio' ? 'audio' : 'video');
    el.preload = 'metadata'; el.muted = true; el.playsInline = true;
    const url = URL.createObjectURL(file); let done = false, dur = 0;
    const finish = o => { if (done) return; done = true; clearTimeout(to); try { el.removeAttribute('src'); el.load(); } catch (e) {} URL.revokeObjectURL(url); resolve(o); };
    const to = setTimeout(() => finish({ duration: dur, w: el.videoWidth || 0, h: el.videoHeight || 0, thumb: null }), 20000);
    el.onloadedmetadata = () => {
      dur = isFinite(el.duration) ? el.duration : 0;
      if (kind === 'audio' || !el.videoWidth) return finish({ duration: dur, w: 0, h: 0, thumb: null });
      el.currentTime = Math.min(Math.max(dur * 0.1, 0.4), Math.max(dur - 0.1, 0));
    };
    el.onseeked = () => {
      try {
        const c = document.createElement('canvas'); const W = 320;
        c.width = W; c.height = Math.max(1, Math.round(W * el.videoHeight / el.videoWidth));
        c.getContext('2d').drawImage(el, 0, 0, c.width, c.height);
        c.toBlob(b => finish({ duration: dur, w: el.videoWidth, h: el.videoHeight, thumb: b }), 'image/jpeg', 0.82);
      } catch (e) { finish({ duration: dur, w: el.videoWidth, h: el.videoHeight, thumb: null }); }
    };
    el.onerror = () => finish({ error: true, duration: 0, w: 0, h: 0, thumb: null });
    el.src = url;
  });
}
const VEXT = /\.(mp4|m4v|mkv|webm|mov|avi|3gp|3g2|ts|mts|m2ts|flv|wmv|ogv|mpg|mpeg)$/i;
const AEXT = /\.(mp3|m4a|aac|ogg|oga|opus|wav|flac|amr|wma)$/i;
function kindOf(f, force) { if (f.type.startsWith('audio/') || AEXT.test(f.name)) return 'audio'; if (f.type.startsWith('video/') || VEXT.test(f.name)) return 'video'; return force || 'video'; }
const stripExt = n => n.replace(/\.[^.]{1,5}$/, '');

// items: File objects, or { file, folder, src, rel } from a folder scan. Dedupe by name + size + lastModified.
const mkey = m => `${m.file}|${m.size}|${m.lm || 0}`;
const known = f => S.media.some(m => m.file === f.name && m.size === f.size && (!m.lm || !f.lastModified || m.lm === f.lastModified));
async function addFiles(fileList, force, opts = {}) {
  const items = [...fileList].map(x => x instanceof Blob ? { file: x } : x).filter(x => x && x.file); if (!items.length) { if (!opts.quiet) render(); return { ok: 0, skipped: 0, failed: 0 }; }
  let ok = 0, skipped = 0, failed = 0, done = 0; const seen = new Set(); const todo = [];
  for (const it of items) { const f = it.file, k = SRC.fkey(f); if (known(f) || seen.has(k)) { skipped++; continue; } seen.add(k); todo.push(it); }
  const label = opts.label ? opts.label + ' — ' : '';
  if (todo.length) toast(`${label}adding 0/${todo.length}…`, 0);
  let lastR = 0; const tick = () => { const now = performance.now(); if (now - lastR > 250 || done === todo.length) { lastR = now; render(); } };
  await SRC.pool(todo, 2, async (it, i) => {             // max 2 thumbnails at a time → smooth on phones
    const f = it.file; const kind = kindOf(f, force);
    const meta = await probe(f, kind);
    done++;
    if (meta.error) { failed++; return; }
    const m = { id: uid(), name: stripExt(f.name), file: f.name, kind, size: f.size, lm: f.lastModified || 0, mime: f.type, duration: meta.duration, w: meta.w, h: meta.h,
      thumb: meta.thumb, added: Date.now() + i, pos: 0, lastPlayed: 0, fav: false, hasBlob: false, sub: null, subName: null,
      folder: it.folder || null, src: it.src || null, rel: it.rel || null };
    blobCache.set(m.id, f);
    if (!m.src) { try { await DB.put('blobs', f, m.id); m.hasBlob = true; } catch (e) { m.hasBlob = false; } }   // folder files are re-read from the folder, not copied
    try { await DB.put('media', m); } catch (e) { /* metadata kept in memory only */ }
    if (m.thumb) thumbURL.set(m.id, URL.createObjectURL(m.thumb));
    S.media.push(m); ok++;
    toast(`${label}adding ${done}/${todo.length}…`, 0); tick();
  });
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  if (!opts.quiet) { const parts = [`${ok} added`]; if (skipped) parts.push(`${skipped} already in library`); if (failed) parts.push(`${failed} can't play in this browser`); toast(parts.join(' • '), 3500); }
  render();
  return { ok, skipped, failed };
}

/* ---------------- folder access: scan the phone's folders (sources.js) ---------------- */
async function saveDir(d) { try { await DB.put('dirs', { id: d.id, name: d.name, handle: d.handle, added: d.added }); d.saved = true; } catch (e) { d.saved = false; } }
async function linkFolder(handle) {
  for (const d of S.dirs) { try { if (d.handle && await d.handle.isSameEntry(handle)) { d.handle = handle; return rescanDir(d, { ask: true }); } } catch (e) {} }
  const d = { id: uid(), name: handle.name, handle, added: Date.now(), perm: 'granted', count: 0 };
  S.dirs.push(d); await saveDir(d);
  return rescanDir(d, { ask: true });
}
async function rescanDir(d, o = {}) {
  let perm = 'granted';
  try { perm = await SRC.permission(d.handle, o.ask); } catch (e) { perm = 'prompt'; }
  d.perm = perm;
  if (perm !== 'granted') { render(); return null; }
  S.scanning = { name: d.name, found: 0 }; toast(`📂 “${d.name}” scan ho raha hai…`, 0); render();
  let found = [];
  try { found = await SRC.scanHandle(d.handle, n => { S.scanning.found = n; toast(`📂 ${n} videos mile…`, 0); }); }
  catch (e) { S.scanning = null; toast(`Couldn't read “${d.name}”`, 4000); render(); return null; }
  const keys = new Set(found.map(x => SRC.fkey(x.file)));
  const gone = S.media.filter(m => m.src === d.id && !keys.has(mkey(m)));       // deleted / moved on the phone → drop from library (files untouched)
  for (const m of gone) { if (P.cur === m) stopPlayback(); S.media = S.media.filter(x => x !== m); await DB.del('media', m.id).catch(() => {}); blobCache.delete(m.id); }
  if (gone.length) for (const p of S.playlists) { const n = p.items.length; p.items = p.items.filter(byId); if (p.items.length !== n) await DB.put('playlists', p).catch(() => {}); }
  for (const x of found) { const m = S.media.find(m => m.src === d.id && mkey(m) === SRC.fkey(x.file)); if (m) blobCache.set(m.id, x.file); }
  const r = await addFiles(found.map(x => ({ ...x, src: d.id })), null, { quiet: true, label: `📂 ${found.length} videos mile` });
  d.count = S.media.filter(m => m.src === d.id).length; S.scanning = null;
  const msg = [`📂 ${d.name}: ${found.length} files`]; if (r.ok) msg.push(`${r.ok} new`); if (gone.length) msg.push(`${gone.length} removed`); if (r.failed) msg.push(`${r.failed} can't play here`);
  toast(msg.join(' • '), 4000); render();
  return { found: found.length, added: r.ok, removed: gone.length, skipped: r.skipped };
}
async function rescanAll(o = {}) { const out = []; for (const d of S.dirs) out.push(await rescanDir(d, o)); return out; }
async function scanFolder() {
  const c = SRC.caps();
  if (c.native) {
    S.scanning = { name: 'phone', found: 0 }; render();
    let items = []; try { items = await SRC.native.scan(n => { S.scanning.found = n; toast(`📂 ${n} videos mile…`, 0); }); } catch (e) { toast('Permission nahi mili — Settings me allow karo', 5000); }
    S.scanning = null; return addFiles(items.map(x => ({ ...x, src: null })), null, { label: `📂 ${items.length} videos mile` });
  }
  if (c.folderPicker) {
    let h; try { h = await SRC.pickFolder(); } catch (e) { return null; }      // user cancelled
    return linkFolder(h);
  }
  if (c.folderInput) return $('#fileDir').click();
  return $('#fileVideo').click();
}
async function unlinkDir(id) {
  const d = S.dirs.find(x => x.id === id); if (!d) return;
  S.dirs = S.dirs.filter(x => x !== d); await DB.del('dirs', id).catch(() => {});
  const list = S.media.filter(m => m.src === id);
  for (const m of list) { if (P.cur === m) stopPlayback(); await DB.del('media', m.id).catch(() => {}); }
  S.media = S.media.filter(m => m.src !== id); render(); toast(`“${d.name}” removed from VLC Pro (files on the phone are not touched)`, 4000);
}
async function restoreDirs() {
  let rows = []; try { rows = await DB.all('dirs'); } catch (e) {}
  S.dirs = rows.map(r => ({ ...r, perm: 'unknown', count: S.media.filter(m => m.src === r.id).length, saved: true }));
  for (const d of S.dirs) {                                   // permission still granted → rescan for new / removed files automatically
    let p = 'prompt'; try { p = await SRC.permission(d.handle, false); } catch (e) {}
    d.perm = p; if (p === 'granted') rescanDir(d);
  }
  render();
}
const accessHTML = () => {
  const c = SRC.caps();
  const main = c.native || c.folderPicker ? `<button class="btn" data-act="scan-folder">${I.folder}Allow access / Folder chuno</button>`
    : c.folderInput ? `<button class="btn" data-act="scan-folder">${I.folder}Poora folder chuno</button>` : '';
  const tip = c.native || c.folderPicker ? 'Ek baar folder chuno (jaise DCIM, Movies ya WhatsApp Video) — naye videos har baar khud aa jayenge.'
    : 'Ek baar poora folder chuno (jaise DCIM/Camera ya WhatsApp Video) — saare videos ek saath add ho jayenge.';
  return `<div class="empty access-card"><div class="ac-ic">${I.folder}</div><h2>Phone ke saare videos, ek tap mein</h2>
    <p>${tip} Sab kuch sirf aapke phone pe rehta hai — kuch bhi upload nahi hota.</p>
    <div class="ac-btns">${main}<button class="btn ghost" data-act="add-video">${I.add}Ek-ek video chuno</button></div></div>`;
};
const accessBarHTML = () => {
  const need = S.dirs.filter(d => d.perm === 'prompt' || d.perm === 'denied');
  if (S.scanning) return `<div class="access-bar"><span>📂 Scan ho raha hai… ${S.scanning.found} videos mile</span></div>`;
  return need.length ? `<div class="access-bar"><span>📂 ${need.map(d => esc(d.name)).join(', ')} — naye videos dekhne ke liye access do</span><button class="btn" data-act="refresh-access">Refresh access</button></div>` : '';
};
async function saveMedia(m) { try { await DB.put('media', m); } catch (e) {} }

/* ---------------- sorting / grouping (like VLC "group videos by name") ---------------- */
function sorter(a, b) {
  const k = SET.sort; let r = 0;
  if (k === 'date') r = (a.added || 0) - (b.added || 0);
  else if (k === 'duration') r = (a.duration || 0) - (b.duration || 0);
  else if (k === 'size') r = (a.size || 0) - (b.size || 0);
  if (!r) r = collator.compare(a.name, b.name);
  return r * SET.dir;
}
function lcp(names) { let p = names[0]; for (const n of names) { let i = 0; while (i < p.length && i < n.length && p[i].toLowerCase() === n[i].toLowerCase()) i++; p = p.slice(0, i); } return p.replace(/[\s_\-.]+$/, '') || names[0]; }
function videoEntries(list) {
  if (!SET.group) return list.slice().sort(sorter).map(m => ({ type: 'media', m }));
  const map = new Map();
  for (const m of list) { const k = m.folder ? 'dir:' + m.folder.toLowerCase() : m.name.toLowerCase().slice(0, 6); if (!map.has(k)) map.set(k, []); map.get(k).push(m); }  // phone folder (like real VLC) or name prefix
  const out = [];
  for (const [k, arr] of map) {
    if (arr.length > 1) { arr.sort(sorter); out.push({ type: 'group', key: k, name: k.startsWith('dir:') ? arr[0].folder : lcp(arr.map(x => x.name)), items: arr,
      added: Math.max(...arr.map(x => x.added || 0)), duration: arr.reduce((s, x) => s + (x.duration || 0), 0), size: arr.reduce((s, x) => s + (x.size || 0), 0) }); }
    else out.push({ type: 'media', m: arr[0] });
  }
  const v = e => e.type === 'group' ? e : e.m;
  return out.sort((a, b) => sorter(v(a), v(b)));
}
const videos = () => S.media.filter(m => m.kind === 'video');
const audios = () => S.media.filter(m => m.kind === 'audio');

/* ---------------- rendering ---------------- */
function thumbHTML(m) {
  const u = thumbURL.get(m.id);
  const inner = u ? `<img src="${u}" alt="" decoding="async">` : `<div class="ph">${m.kind === 'audio' ? I.note : I.clap}</div>`;
  const prog = m.pos > 1 && m.duration ? `<span class="prog" style="width:${Math.min(100, m.pos / m.duration * 100).toFixed(1)}%"></span>` : '';
  const fav = m.fav ? `<span class="fav">${I.heart}</span>` : '';
  return `<div class="thumb">${inner}${prog}${fav}</div>`;
}
function mosaicHTML(items, icon) {
  const urls = items.map(m => thumbURL.get(m.id)).filter(Boolean).slice(0, 4);
  if (!urls.length) return `<div class="thumb"><div class="ph">${icon || I.folder}</div></div>`;
  if (urls.length === 1) return `<div class="thumb"><img src="${urls[0]}" alt=""></div>`;
  let style = 'grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr', cells = urls.map(u => `<img src="${u}" alt="">`).join('');
  if (urls.length === 2) style = 'grid-template-columns:1fr 1fr;grid-template-rows:1fr';
  if (urls.length === 3) cells = `<img src="${urls[0]}" alt="" style="grid-row:span 2">` + urls.slice(1).map(u => `<img src="${u}" alt="">`).join('');
  return `<div class="thumb"><div class="mosaic" style="${style}">${cells}</div></div>`;
}
function subOf(m) { if (m.kind === 'audio') return fmt(m.duration) + (m.size ? ` • ${size(m.size)}` : ''); const r = res(m.w, m.h); return fmt(m.duration) + (r ? ` • ${r}` : ''); }
function mediaRow(m, extra = '') {
  return `<div class="row" tabindex="0" data-kind="media" data-id="${m.id}" ${extra}>${thumbHTML(m)}<div class="meta"><div class="title">${esc(m.name)}</div><div class="sub">${esc(subOf(m))}</div></div><button class="icon-btn more" data-act="menu" aria-label="More options for ${esc(m.name)}">${I.vmore}</button></div>`;
}
function groupRow(g) {
  return `<div class="row" tabindex="0" data-kind="group" data-key="${esc(g.key)}">${mosaicHTML(g.items)}<div class="meta"><div class="title">${esc(g.name)}</div><div class="sub">${g.items.length} videos</div></div><button class="icon-btn more" data-act="menu" aria-label="More options for ${esc(g.name)}">${I.vmore}</button></div>`;
}
function playlistRow(p) {
  const items = p.items.map(byId).filter(Boolean);
  return `<div class="row" tabindex="0" data-kind="playlist" data-pid="${p.id}">${mosaicHTML(items, I.plist)}<div class="meta"><div class="title">${esc(p.name)}</div><div class="sub">${items.length} ${items.length === 1 ? 'item' : 'items'} • ${fmt(items.reduce((s, x) => s + (x.duration || 0), 0))}</div></div><button class="icon-btn more" data-act="menu" aria-label="More options for ${esc(p.name)}">${I.vmore}</button></div>`;
}
const wrap = rows => `<div class="${SET.view === 'grid' ? 'grid' : 'list'}">${rows}</div>`;
const emptyHTML = (icon, title, text, btns) => `<div class="empty"><div class="big-ic">${icon}</div><h2>${esc(title)}</h2><p>${text}</p>${btns || ''}</div>`;
const FOOT = `<div class="foot-note">VLC Pro • Educational project, not affiliated with VideoLAN • Your videos never leave this phone</div>`;

function setToolbar(title, backFn) {
  const fm = !!backFn; $('#app').classList.toggle('folder-mode', fm);
  $('#tbBack').classList.toggle('hidden', !fm); $('#tbTitle').textContent = title;
  $('#tbBack').onclick = backFn || null;
}
function setTabs(names, active, key) {
  const t = $('#tabs'); const sig = names.join('|') + '#' + (key || '');
  if (t.dataset.sig !== sig) {
    t.innerHTML = names.map((n, i) => `<button class="tab${i === active ? ' active' : ''}" role="tab" aria-selected="${i === active}" data-tab="${i}">${esc(n)}</button>`).join('')
      + (names.length ? '<i class="tab-ind" aria-hidden="true"></i>' : '');
    t.dataset.sig = sig; t.dataset.key = key || ''; Liquid.resetTabs();
  } else $$('.tab', t).forEach((b, i) => { b.classList.toggle('active', i === active); b.setAttribute('aria-selected', i === active); });
  if (names.length) Liquid.tabs(active);
}
const match = (m, q) => !q || m.name.toLowerCase().includes(q);
const noRes = () => emptyHTML(I.search, 'No results', `Nothing matches “${esc(S.search)}”.`);

function render() {
  const c = $('#content'); const q = (S.search || '').trim().toLowerCase();
  $$('#bottomnav button').forEach(b => b.classList.toggle('active', b.dataset.nav === S.nav));
  Liquid.nav();
  const fabOn = !S.folder && !S.playlist && !S.sub && ((S.nav === 'video' && S.tab.video === 0) || (S.nav === 'audio' && S.tab.audio === 0));
  $('#fab').classList.toggle('hidden', !fabOn);
  let html = '';
  if (S.playlist) {
    const p = S.playlists.find(x => x.id === S.playlist); if (!p) { S.playlist = null; return render(); }
    setToolbar(p.name, closeDetail); setTabs([], 0);
    const items = p.items.map(byId).filter(Boolean);
    html = items.length ? `<div class="pl-actions" style="display:flex;gap:10px;padding:12px 14px 10px"><button class="btn" data-act="pl-play">${I.play}Play all</button><button class="btn ghost" data-act="pl-shuffle">${I.shuffle}Shuffle</button></div>` + wrap(items.map((m, i) => match(m, q) ? mediaRow(m, `data-pidx="${i}"`) : '').join(''))
      : emptyHTML(I.plist, 'Playlist is empty', 'Open any video\'s ⋮ menu and choose “Add to playlist”.');
  } else if (S.folder) {
    const g = videoEntries(videos()).find(e => e.type === 'group' && e.key === S.folder);
    if (!g) { S.folder = null; dropLayer('detail'); return render(); }
    setToolbar(g.name, closeDetail); setTabs([], 0);
    html = wrap(g.items.filter(m => match(m, q)).map(m => mediaRow(m)).join(''));
  } else if (S.sub === 'history') {
    setToolbar('History', closeDetail); setTabs([], 0);
    const items = S.media.filter(m => m.lastPlayed && match(m, q)).sort((a, b) => b.lastPlayed - a.lastPlayed);
    html = items.length ? `<div style="padding:12px 14px 10px"><button class="btn ghost" data-act="clear-history">${I.del}Clear history</button></div>` + wrap(items.map(m => mediaRow(m)).join(''))
      : emptyHTML(I.history, 'No history yet', 'Videos and songs you play show up here.');
  } else if (S.nav === 'video') {
    setToolbar('VLC Pro'); setTabs(['Videos', 'Playlists'], S.tab.video, 'video');
    if (S.tab.video === 0) {
      const vids = videos();
      if (!vids.length) html = accessBarHTML() + (S.scanning ? '' : accessHTML()) + FOOT;
      else if (q) { const r = vids.filter(m => match(m, q)).sort(sorter); html = r.length ? wrap(r.map(m => mediaRow(m)).join('')) : noRes(); }
      else html = accessBarHTML() + wrap(videoEntries(vids).map(e => e.type === 'group' ? groupRow(e) : mediaRow(e.m)).join(''));
    } else html = playlistsHTML(q);
  } else if (S.nav === 'audio') {
    setToolbar('Audio'); setTabs(['Tracks', 'Playlists'], S.tab.audio, 'audio');
    if (S.tab.audio === 0) {
      const au = audios().filter(m => match(m, q)).sort(sorter);
      html = au.length ? wrap(au.map(m => mediaRow(m)).join('')) : (q ? noRes() : emptyHTML(I.note, 'No audio yet', 'Add songs or audio files from your phone.', `<button class="btn" data-act="add-audio">${I.add}Add audio</button>`));
    } else html = playlistsHTML(q);
  } else if (S.nav === 'browse') {
    setToolbar('Browse'); setTabs([], 0);
    const favs = S.media.filter(m => m.fav && match(m, q)).sort(sorter);
    const hist = S.media.filter(m => m.lastPlayed && match(m, q)).sort((a, b) => b.lastPlayed - a.lastPlayed).slice(0, 5);
    const groups = videoEntries(videos()).filter(e => e.type === 'group');
    html = `<div class="section-h">Local storage</div>
      <div class="set" data-act="scan-folder" tabindex="0"><span class="si">${I.folder}</span><div class="st"><b>Scan a phone folder</b><small>All videos in DCIM, Movies, WhatsApp Video… at once</small></div></div>
      <div class="set" data-act="add-video" tabindex="0"><span class="si">${I.phone}</span><div class="st"><b>Add videos from phone</b><small>Pick one or many videos</small></div></div>
      <div class="set" data-act="add-audio" tabindex="0"><span class="si">${I.note}</span><div class="st"><b>Add audio from phone</b><small>MP3, M4A, WAV, OGG…</small></div></div>
      <div class="section-h">Favorites</div>${favs.length ? wrap(favs.map(m => mediaRow(m)).join('')) : '<div class="sh-body">Tap ⋮ → “Add to favorites” on any video or song.</div>'}
      <div class="section-h">Recently played</div>${hist.length ? wrap(hist.map(m => mediaRow(m)).join('')) + `<div class="set" data-act="history" tabindex="0"><span class="si">${I.history}</span><div class="st"><b>See full history</b></div></div>` : '<div class="sh-body">Nothing played yet.</div>'}
      ${groups.length ? '<div class="section-h">Folders</div>' + wrap(groups.map(groupRow).join('')) : ''}`;
  } else if (S.nav === 'playlists') {
    setToolbar('Playlists'); setTabs([], 0); html = playlistsHTML(q);
  } else if (S.nav === 'more') {
    setToolbar('More'); setTabs([], 0); html = moreHTML();
  }
  c.innerHTML = html;
  $('#searchInput').placeholder = S.nav === 'audio' && S.tab.audio === 0 ? 'Search audio' : (S.nav === 'playlists' || (S.nav === 'video' && S.tab.video === 1) || (S.nav === 'audio' && S.tab.audio === 1)) ? 'Search playlists' : 'Search videos';
}
function playlistsHTML(q) {
  const pls = S.playlists.filter(p => !q || p.name.toLowerCase().includes(q)).sort((a, b) => collator.compare(a.name, b.name));
  const newBtn = `<div style="padding:12px 14px 10px"><button class="btn" data-act="new-playlist">${I.add}New playlist</button></div>`;
  return newBtn + (pls.length ? wrap(pls.map(playlistRow).join('')) : (q ? noRes() : emptyHTML(I.plist, 'No playlists yet', 'Create a playlist, then add videos or songs to it from their ⋮ menu.')));
}
function moreHTML() {
  const seg = (k, opts) => `<span class="seg">${opts.map(([v, l]) => `<button data-set="${k}" data-val="${v}" class="${String(SET[k]) === String(v) ? 'on' : ''}">${l}</button>`).join('')}</span>`;
  const sortName = { name: 'Name', date: 'Date added', duration: 'Length', size: 'Size' }[SET.sort];
  return `<div class="section-h">Appearance</div>
  <div class="set"><span class="si">${I.glass}</span><div class="st"><b>Style</b><small>Liquid glass or exact classic look</small></div>${seg('style', [['glass', 'Liquid Glass'], ['classic', 'Classic']])}</div>
  <div class="set"><span class="si">${I.theme}</span><div class="st"><b>Theme</b></div>${seg('theme', [['dark', 'Dark'], ['light', 'Light']])}</div>
  <div class="set"><span class="si">${SET.view === 'grid' ? I.grid : I.listic}</span><div class="st"><b>Video list</b></div>${seg('view', [['list', 'List'], ['grid', 'Grid']])}</div>
  <div class="section-h">Media folders</div>
  ${S.dirs.map(d => `<div class="set"><span class="si">${I.folder}</span><div class="st"><b>${esc(d.name)}</b><small>${d.count || 0} files • ${d.perm === 'granted' ? 'access on' : 'tap Rescan to allow access'}</small></div><span class="seg"><button data-act="rescan" data-dir="${d.id}">Rescan</button><button data-act="unlink-dir" data-dir="${d.id}">Remove</button></span></div>`).join('')}
  <div class="set" data-act="scan-folder" tabindex="0"><span class="si">${I.add}</span><div class="st"><b>${SRC.caps().folderPicker || SRC.caps().native ? 'Allow access / add a folder' : 'Pick a whole folder'}</b><small>${SRC.caps().native ? 'Uses the phone\'s media permission' : SRC.caps().folderPicker ? 'New videos are found automatically each time you open the app' : 'This browser can\'t keep folder access, so pick the folder again to add new videos'}</small></div></div>
  <div class="section-h">Library</div>
  <div class="set" data-act="sort" tabindex="0"><span class="si">${I.sort}</span><div class="st"><b>Sort by</b><small>${sortName} (${SET.dir > 0 ? 'ascending' : 'descending'})</small></div></div>
  <div class="set"><span class="si">${I.group}</span><div class="st"><b>Group videos by name</b><small>Similar names become folders (“7 videos”)</small></div>${seg('group', [['true', 'On'], ['false', 'Off']])}</div>
  <div class="set" data-act="history" tabindex="0"><span class="si">${I.history}</span><div class="st"><b>Playback history</b></div></div>
  <div class="set" data-act="storage" tabindex="0"><span class="si">${I.storage}</span><div class="st"><b>Storage used</b><small id="storageTxt">Tap to check</small></div></div>
  <div class="set" data-act="clear-lib" tabindex="0"><span class="si">${I.del}</span><div class="st"><b>Clear library</b><small>Removes all videos, songs and playlists from this app</small></div></div>
  <div class="section-h">Playback</div>
  <div class="set"><span class="si">${I.bg}</span><div class="st"><b>Background audio</b><small>Keep playing when you leave the app or close the player</small></div>${seg('bgAudio', [['true', 'On'], ['false', 'Off']])}</div>
  <div class="set" data-act="shortcuts" tabindex="0"><span class="si">${I.kb}</span><div class="st"><b>Keyboard shortcuts</b><small>For laptop / desktop</small></div></div>
  <div class="section-h">About</div>
  <div class="set" data-act="about" tabindex="0"><span class="si">${I.info}</span><div class="st"><b>VLC Pro by Tech Bro Z</b><small>Educational project, not affiliated with VideoLAN</small></div></div>`;
}

/* ---------------- bottom sheets (menus / dialogs) ---------------- */
let sheetOpen = false;
function openSheet(html, bind) {
  sheetMap = {}; $('#sheet').innerHTML = html; $('#sheetWrap').classList.remove('hidden');
  if (!sheetOpen) { sheetOpen = true; pushLayer('sheet', () => hideSheet()); }
  if (bind) bind($('#sheet'));
}
function hideSheet() { sheetOpen = false; $('#sheetWrap').classList.add('hidden'); $('#sheet').innerHTML = ''; }
function closeSheet() { if (sheetOpen) { dropLayer('sheet'); hideSheet(); } }
$('#scrim').onclick = closeSheet;
const item = (act, icon, label, val = '', cls = '', data = '') => `<button class="sh-item ${cls}" data-sa="${act}" ${data}><span class="si">${icon}</span><span>${esc(label)}</span>${val ? `<span class="sv">${esc(val)}</span>` : ''}</button>`;
let sheetMap = {};
$('#sheet').addEventListener('click', e => { const b = e.target.closest('[data-sa]'); if (b && sheetMap[b.dataset.sa]) sheetMap[b.dataset.sa](b); });
const onSheet = map => () => { sheetMap = map; };

function mediaMenu(m, ctx = {}) {
  let h = `<div class="sh-h">${thumbHTML(m)}<div><b>${esc(m.name)}</b><small>${esc(subOf(m))}</small></div></div>` + item('play', I.play, 'Play') + (m.pos > 1 ? item('start', I.restart, 'Play from start') : '')
    + item('addpl', I.addlist, 'Add to playlist') + item('fav', m.fav ? I.heart : I.heartO, m.fav ? 'Remove from favorites' : 'Add to favorites');
  if (ctx.pid) h += item('up', I.up, 'Move up') + item('down', I.down, 'Move down') + item('rmpl', I.close, 'Remove from playlist');
  h += item('rename', I.edit, 'Rename') + item('info', I.info, 'Information') + item('remove', I.del, 'Remove from list', '', 'danger');
  openSheet(h, onSheet({
    play: () => { closeSheet(); playFrom(m.id, ctx.queue); },
    start: () => { closeSheet(); playFrom(m.id, ctx.queue, { fromStart: true }); },
    addpl: () => addToPlaylistSheet([m.id]),
    fav: async () => { m.fav = !m.fav; await saveMedia(m); closeSheet(); render(); toast(m.fav ? 'Added to favorites' : 'Removed from favorites'); },
    up: () => movePl(ctx.pid, ctx.pidx, -1), down: () => movePl(ctx.pid, ctx.pidx, 1),
    rmpl: async () => { const p = S.playlists.find(x => x.id === ctx.pid); p.items.splice(ctx.pidx, 1); await DB.put('playlists', p).catch(() => {}); closeSheet(); render(); toast('Removed from playlist'); },
    rename: () => renameSheet(m), info: () => infoSheet(m), remove: () => removeMedia([m]),
  }));
}
function groupMenu(g) {
  openSheet(`<div class="sh-h">${mosaicHTML(g.items)}<div><b>${esc(g.name)}</b><small>${g.items.length} videos</small></div></div>`
    + item('play', I.play, 'Play all') + item('shuf', I.shuffle, 'Shuffle play') + item('addpl', I.addlist, 'Add all to playlist') + item('remove', I.del, 'Remove all from list', '', 'danger'),
  onSheet({
    play: () => { closeSheet(); playQueue(g.items.map(x => x.id), 0); },
    shuf: () => { closeSheet(); P.shuffle = true; playQueue(g.items.map(x => x.id), Math.floor(Math.random() * g.items.length)); },
    addpl: () => addToPlaylistSheet(g.items.map(x => x.id)), remove: () => removeMedia(g.items),
  }));
}
function playlistMenu(p) {
  openSheet(`<div class="sh-h"><div><b>${esc(p.name)}</b><small>${p.items.length} items</small></div></div>` + item('play', I.play, 'Play') + item('shuf', I.shuffle, 'Shuffle play') + item('rename', I.edit, 'Rename') + item('del', I.del, 'Delete playlist', '', 'danger'),
  onSheet({
    play: () => { closeSheet(); playPlaylist(p, false); }, shuf: () => { closeSheet(); playPlaylist(p, true); },
    rename: () => promptSheet('Rename playlist', p.name, async v => { p.name = v; await DB.put('playlists', p).catch(() => {}); render(); }),
    del: async () => { S.playlists = S.playlists.filter(x => x !== p); await DB.del('playlists', p.id).catch(() => {}); closeSheet(); render(); toast('Playlist deleted'); },
  }));
}
function promptSheet(title, val, onOk, okLabel = 'Save') {
  openSheet(`<div class="sh-h">${esc(title)}</div><div class="sh-body"><input type="text" id="promptIn" value="${esc(val)}" maxlength="120" aria-label="${esc(title)}"></div><div class="sh-actions"><button class="btn ghost" data-sa="cancel">Cancel</button><button class="btn" data-sa="ok" id="promptOk">${esc(okLabel)}</button></div>`, el => {
    const inp = $('#promptIn', el); setTimeout(() => { inp.focus(); inp.select(); }, 60);
    const ok = () => { const v = inp.value.trim(); if (!v) return inp.focus(); closeSheet(); onOk(v); };
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') ok(); });
    onSheet({ cancel: closeSheet, ok })(el);
  });
}
function renameSheet(m) { promptSheet('Rename', m.name, async v => { m.name = v; await saveMedia(m); render(); if (P.cur === m) $('#pTitle').textContent = v; toast('Renamed'); }); }
function infoSheet(m) {
  const rows = [['Name', m.name], ['File', m.file], ['Type', m.kind === 'audio' ? 'Audio' : 'Video'], ['Length', fmt(m.duration)], m.w ? ['Resolution', `${m.w}×${m.h} (${res(m.w, m.h)})`] : null,
    ['Size', size(m.size)], ['Format', m.mime || '—'], ['Added', new Date(m.added).toLocaleString()], m.lastPlayed ? ['Last played', new Date(m.lastPlayed).toLocaleString() + ` at ${fmt(m.pos)}`] : null, m.subName ? ['Subtitles', m.subName] : null,
    ['Saved on phone', m.hasBlob ? 'Yes (works after reload, offline)' : 'No — add the file again after reload']].filter(Boolean);
  openSheet(`<div class="sh-h">Information</div><div class="sh-body"><table class="info">${rows.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join('')}</table></div>`);
}
async function removeMedia(list) {
  closeSheet();
  if (P.cur && list.includes(P.cur)) stopPlayback();
  const saved = [];
  for (const m of list) {
    let b = blobCache.get(m.id); if (!b) { try { b = await DB.get('blobs', m.id); } catch (e) {} }
    saved.push({ m, b });
    S.media = S.media.filter(x => x !== m); await DB.del('media', m.id).catch(() => {}); await DB.del('blobs', m.id).catch(() => {});
  }
  render();
  toast(list.length > 1 ? `${list.length} removed from list` : 'Removed from list', 5000, 'Undo', async () => {
    for (const s of saved) { S.media.push(s.m); if (s.b) { blobCache.set(s.m.id, s.b); await DB.put('blobs', s.b, s.m.id).catch(() => {}); } await saveMedia(s.m); }
    render();
  });
}
function addToPlaylistSheet(ids) {
  const pls = S.playlists.slice().sort((a, b) => collator.compare(a.name, b.name));
  openSheet(`<div class="sh-h">Add to playlist</div>` + item('new', I.add, 'New playlist…') + pls.map(p => item('pl', I.plist, p.name, String(p.items.length), '', `data-pid="${p.id}"`)).join(''),
    onSheet({
      new: () => promptSheet('New playlist', 'My playlist', async v => { const p = { id: uid(), name: v, items: [...ids], created: Date.now() }; S.playlists.push(p); await DB.put('playlists', p).catch(() => {}); render(); toast(`Added to “${v}”`); }, 'Create'),
      pl: async b => { const p = S.playlists.find(x => x.id === b.dataset.pid); let n = 0; for (const id of ids) if (!p.items.includes(id)) { p.items.push(id); n++; } await DB.put('playlists', p).catch(() => {}); closeSheet(); render(); toast(n ? `Added to “${p.name}”` : 'Already in this playlist'); },
    }));
}
async function movePl(pid, i, d) { const p = S.playlists.find(x => x.id === pid); const j = i + d; closeSheet(); if (j < 0 || j >= p.items.length) return; [p.items[i], p.items[j]] = [p.items[j], p.items[i]]; await DB.put('playlists', p).catch(() => {}); render(); }
function sortSheet() {
  const opts = [['name', 'Name'], ['date', 'Date added'], ['duration', 'Length'], ['size', 'Size']];
  openSheet(`<div class="sh-h">Sort by</div>` + opts.map(([k, l]) => item('k', SET.sort === k ? I.check : I.blank, l, SET.sort === k ? (SET.dir > 0 ? '↑ ascending' : '↓ descending') : '', '', `data-k="${k}"`)).join(''),
    onSheet({ k: b => { const k = b.dataset.k; if (SET.sort === k) SET.dir = -SET.dir; else { SET.sort = k; SET.dir = k === 'name' ? 1 : -1; } saveSet(); closeSheet(); render(); toast(`Sorted by ${opts.find(o => o[0] === k)[1]} ${SET.dir > 0 ? '↑' : '↓'}`); } }));
}
function mainMenu() {
  openSheet(item('scan', I.folder, 'Scan phone folder') + item('addv', I.add, 'Add videos') + item('adda', I.note, 'Add audio') + item('sort', I.sort, 'Sort by…') + item('view', SET.view === 'grid' ? I.listic : I.grid, SET.view === 'grid' ? 'List view' : 'Grid view')
    + item('group', I.group, 'Group videos by name', SET.group ? 'On' : 'Off') + item('style', I.glass, 'Style', SET.style === 'glass' ? 'Liquid Glass' : 'Classic') + item('theme', I.theme, 'Theme', SET.theme === 'dark' ? 'Dark' : 'Light')
    + item('hist', I.history, 'Playback history') + item('set', I.info, 'Settings & about'),
  onSheet({
    scan: () => { closeSheet(); scanFolder(); }, addv: () => { closeSheet(); $('#fileVideo').click(); }, adda: () => { closeSheet(); $('#fileAudio').click(); }, sort: sortSheet,
    view: () => { closeSheet(); setOpt('view', SET.view === 'grid' ? 'list' : 'grid'); },
    group: () => { closeSheet(); setOpt('group', !SET.group); },
    style: () => { closeSheet(); setOpt('style', SET.style === 'glass' ? 'classic' : 'glass'); },
    theme: () => { closeSheet(); setOpt('theme', SET.theme === 'dark' ? 'light' : 'dark'); },
    hist: () => { closeSheet(); openHistory(); }, set: () => { closeSheet(); go('more'); },
  }));
}
function setOpt(k, v) { if (k === 'group' || k === 'bgAudio') v = v === true || v === 'true'; SET[k] = v; saveSet(); if (k === 'style') params.delete('style'); if (k === 'theme') params.delete('theme'); applyRootAttrs(); render(); }
function shortcutsSheet() {
  const k = [['Space / K', 'Play / pause'], ['← / J', 'Back 10 s'], ['→ / L', 'Forward 10 s'], ['↑ / ↓', 'Volume'], ['M', 'Mute'], ['F', 'Fullscreen'], ['[ / ]', 'Slower / faster'], ['N / B', 'Next / previous'], ['S', 'Screenshot'], ['P', 'Picture in picture'], ['A', 'A-B repeat'], ['Esc', 'Close player'], ['/', 'Search (library)']];
  openSheet(`<div class="sh-h">Keyboard shortcuts</div><div class="sh-body"><table class="info">${k.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</table></div>`);
}
function aboutSheet() {
  openSheet(`<div class="sh-h"><span style="width:27px;height:33px;display:block">${CONE}</span>VLC Pro by Tech Bro Z</div><div class="sh-body">
  <p><b style="color:var(--text)">Educational project, not affiliated with VideoLAN.</b> “VLC” and the cone belong to VideoLAN; VLC Pro is a personal learning project inspired by the VLC for Android video screen.</p>
  <p>🔒 Your videos, songs, playlists and history are stored only in this browser on your phone (IndexedDB). Nothing is uploaded — there is no server and no account.</p>
  <p>Made by Tech Bro Z — YouTube @techbrozdeveloper • Instagram @tech_bro_z_1</p></div>`);
}


/* ================= LIQUID MOTION =================
   - a glass "blob" behind the active bottom-nav item that flows to the tapped item like liquid
     (real damped-spring physics: it stretches along the direction of travel, squishes, overshoots, settles)
   - the same liquid pill (Liquid Glass) / orange underline (Classic) on the top VIDEOS / PLAYLISTS tabs
   - page content slides left/right in the direction of the change with a soft fade
   - swipe left/right on the list to change tabs
   Only transform + opacity are animated (smooth 60fps on phones); prefers-reduced-motion = instant. */
const Liquid = (() => {
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => RM.matches || params.has('nomotion');
  const glass = () => root.dataset.style === 'glass';
  const SEQ = [['video', 0], ['video', 1], ['audio', 0], ['audio', 1], ['browse', null], ['playlists', null], ['more', null]];
  const stat = { navMoves: 0, tabMoves: 0, slides: 0, swipes: 0 };

  // Damped spring (stiffness k, damping c) sampled at 60fps -> list of {p, v} with p: 0 -> 1 (overshoots a little)
  function spring(k = 300, c = 21) {
    const out = []; let p = 0, v = 0; const dt = 1 / 60;
    for (let i = 0; i < 90; i++) {
      const a = -k * (p - 1) - c * v; v += a * dt; p += v * dt; out.push({ p, v });
      if (i > 12 && Math.abs(p - 1) < 0.002 && Math.abs(v) < 0.02) break;
    }
    out[out.length - 1] = { p: 1, v: 0 }; return out;
  }
  // Read where an element visually is right now (works mid-animation, so taps can interrupt smoothly)
  function current(el, W) {
    const m = new DOMMatrix(getComputedStyle(el).transform === 'none' ? undefined : getComputedStyle(el).transform);
    return { cx: m.e + W / 2, w: W * m.a };
  }
  // Move element (base width W, transform-origin center) so its centre is at cx and its width is w.
  function move(el, W, from, to, opt = {}) {
    const fin = `translateX(${(to.cx - W / 2).toFixed(2)}px) scale(${(to.w / W).toFixed(4)},1)`;
    if (el._anim) { el._anim.cancel(); el._anim = null; }
    if (!from || reduced() || (Math.abs(from.cx - to.cx) < 0.5 && Math.abs(from.w - to.w) < 0.5)) { el.style.transform = fin; return false; }
    const dist = to.cx - from.cx, steps = spring(opt.k, opt.c), frames = [];
    for (const { p, v } of steps) {
      const speed = Math.abs(v * dist);                              // px per second
      const cx = from.cx + dist * p, w = from.w + (to.w - from.w) * Math.min(1, Math.max(0, p));
      const extra = Math.min(opt.maxPx || 60, speed / (opt.per || 1400) * w);   // liquid stretch grows with speed (in px)
      let sx = (w + extra) / W;
      if (opt.bounds) {                                               // stay inside the bar: squash against its rounded ends
        const room = 2 * Math.min(cx - opt.bounds[0], opt.bounds[1] - cx);
        sx = Math.max(Math.min(sx, room / W), (w / W) * 0.72);
      }
      const st = Math.max(0, sx * W / w - 1);
      const sy = 1 - Math.min(0.3, st * (opt.squish ?? 0.42));
      frames.push({ transform: `translateX(${(cx - W / 2).toFixed(2)}px) scale(${sx.toFixed(4)},${sy.toFixed(4)})` });
    }
    frames[frames.length - 1] = { transform: fin };
    el.style.transform = fin;
    const a = el.animate(frames, { duration: steps.length * (1000 / 60), easing: 'linear' });
    el._anim = a; el.classList.add('moving');
    a.onfinish = a.oncancel = () => { if (el._anim === a) { el._anim = null; el.classList.remove('moving'); } };
    return true;
  }

  // ---- bottom nav blob ----
  let navIdx = -1, navStyle = '', navW = 0;
  function nav(force) {
    const blob = $('#navBlob'); if (!blob) return;
    const btns = $$('#bottomnav button'), i = btns.findIndex(b => b.classList.contains('active'));
    if (i < 0) return;
    const b = btns[i], W = b.offsetWidth, st = root.dataset.style;
    if (!W) return;
    const fresh = force || navIdx < 0 || st !== navStyle || Math.abs(W - navW) > 0.5;
    if (!fresh && i === navIdx) return;
    const from = fresh ? null : current(blob, W);
    blob.style.width = W + 'px'; blob.style.height = b.offsetHeight + 'px'; blob.style.top = b.offsetTop + 'px';
    const nb = $('#bottomnav'), pad = parseFloat(getComputedStyle(nb).paddingLeft) || 0;
    if (move(blob, W, from, { cx: b.offsetLeft + W / 2, w: W }, { k: 280, c: 19, per: 900, maxPx: 0.6 * W, bounds: [pad * 0.5, nb.clientWidth - pad * 0.5] })) stat.navMoves++;
    navIdx = i; navStyle = st; navW = W;
  }
  // ---- top tabs pill / underline ----
  let tabIdx = -1, tabStyle = '';
  function resetTabs() { tabIdx = -1; }
  function tabs(active, force) {
    const t = $('#tabs'), ind = $('.tab-ind', t), btns = $$('.tab', t), b = btns[active];
    if (!ind || !b || !b.offsetWidth) return;
    const st = root.dataset.style, fresh = force || tabIdx < 0 || st !== tabStyle;
    if (!fresh && active === tabIdx) return;
    const W = glass() ? b.offsetWidth : 100;                     // classic underline: 100px base scaled to the tab's width
    const from = fresh ? null : current(ind, W);
    ind.style.width = W + 'px';
    if (glass()) { ind.style.top = b.offsetTop + 'px'; ind.style.height = b.offsetHeight + 'px'; } else { ind.style.top = ''; ind.style.height = ''; }
    const pl = parseFloat(getComputedStyle(t).paddingLeft) || 0;
    const opt = glass() ? { k: 300, c: 20, per: 800, maxPx: 70, bounds: [pl, t.clientWidth - pl] } : { k: 320, c: 26, per: 1600, maxPx: 50, squish: 0 };
    if (move(ind, W, from, { cx: b.offsetLeft + b.offsetWidth / 2, w: b.offsetWidth }, opt)) stat.tabMoves++;
    tabIdx = active; tabStyle = st;
  }
  function relayout() { nav(true); const a = $('#tabs .tab.active'); if (a) tabs(+a.dataset.tab, true); }
  addEventListener('resize', relayout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);

  // ---- content slide ----
  const pos = () => (S.folder || S.playlist || S.sub) ? -1 : SEQ.findIndex(([n, t]) => n === S.nav && (t === null || S.tab[n] === t));
  function ghostOf(c, offset) {
    const g = document.createElement('div'); g.className = 'content-ghost'; g.setAttribute('aria-hidden', 'true');
    const cs = getComputedStyle(c);
    Object.assign(g.style, { top: c.offsetTop + 'px', left: c.offsetLeft + 'px', width: c.offsetWidth + 'px', height: c.clientHeight + 'px' });
    const inner = document.createElement('div'); inner.innerHTML = c.innerHTML;
    inner.style.padding = cs.padding; inner.style.transform = `translateY(${-c.scrollTop}px)`;
    $$('[id],[data-kind],[data-act],[tabindex]', inner).forEach(e => { ['id', 'data-kind', 'data-act', 'tabindex'].forEach(a => e.removeAttribute(a)); });
    g.inert = true;
    g.appendChild(inner); if (offset) g.style.transform = `translateX(${offset}px)`;
    return g;
  }
  function slide(mutate, offset = 0) {
    const c = $('#content'), before = pos();
    const g = reduced() ? null : ghostOf(c, offset);
    if (g) $('#app').insertBefore(g, $('#mini'));
    mutate();
    const after = pos(), dir = Math.sign(after - before);
    c.style.transform = '';
    if (!g) return;
    if (!dir || before < 0 || after < 0) { g.remove(); return; }
    const W = c.offsetWidth;
    g.animate([{ transform: `translateX(${offset}px)`, opacity: 1 }, { opacity: 0, offset: 0.62 }, { transform: `translateX(${-dir * W * 0.5}px) scale(.95)`, opacity: 0 }],
      { duration: 300, easing: 'cubic-bezier(.25,.8,.3,1)', fill: 'forwards' }).onfinish = () => g.remove();
    c.animate([{ transform: `translateX(${dir * W * 0.34}px) scale(.97)`, opacity: 0 }, { offset: .55, opacity: 1 },
      { transform: 'translateX(0) scale(1)', opacity: 1 }], { duration: 440, easing: 'cubic-bezier(.2,1.18,.35,1)' });
    stat.slides++;
  }
  function goSeq(i, offset) {
    const [n, t] = SEQ[i];
    slide(() => { if (t !== null) S.tab[n] = t; go(n); }, offset);
  }

  // ---- swipe left / right on the content to change tabs ----
  const c = $('#content'); let sw = null, swallowClick = 0;
  c.addEventListener('touchstart', e => {
    if (e.touches.length !== 1 || pos() < 0 || S.search !== null) { sw = null; return; }
    const t = e.touches[0]; sw = { x: t.clientX, y: t.clientY, t: performance.now(), lock: null, dx: 0 };
  }, { passive: true });
  c.addEventListener('touchmove', e => {
    if (!sw) return; const t = e.touches[0], dx = t.clientX - sw.x, dy = t.clientY - sw.y;
    if (!sw.lock && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) sw.lock = Math.abs(dx) > Math.abs(dy) * 1.3 ? 'h' : 'v';
    if (sw.lock !== 'h') return;
    const p = pos(), edge = (dx > 0 && p <= 0) || (dx < 0 && p >= SEQ.length - 1);
    sw.dx = dx * (edge ? 0.18 : 0.45);                            // rubber band at the first / last tab
    if (!reduced()) c.style.transform = `translateX(${sw.dx.toFixed(1)}px)`;
  }, { passive: true });
  const end = e => {
    if (!sw || sw.lock !== 'h') { sw = null; return; }
    const raw = (e.changedTouches[0].clientX - sw.x), v = raw / Math.max(1, performance.now() - sw.t), p = pos();
    const target = raw < 0 ? p + 1 : p - 1, off = sw.dx; sw = null; swallowClick = performance.now();
    if ((Math.abs(raw) > 60 || Math.abs(v) > 0.45) && target >= 0 && target < SEQ.length) { stat.swipes++; goSeq(target, off); return; }
    c.style.transform = '';
    if (!reduced() && off) c.animate([{ transform: `translateX(${off}px)` }, { transform: 'translateX(0)' }], { duration: 380, easing: 'cubic-bezier(.2,1.4,.4,1)' });
  };
  c.addEventListener('touchend', end); c.addEventListener('touchcancel', end);
  c.addEventListener('click', e => { if (performance.now() - swallowClick < 350) { e.stopPropagation(); e.preventDefault(); } }, true);

  return { nav, tabs, resetTabs, slide, goSeq, pos, relayout, stat, SEQ };
})();

/* ---------------- navigation ---------------- */
function go(nav) { closeSearch(true); if (S.folder || S.playlist || S.sub) dropLayer('detail'); S.nav = nav; S.folder = null; S.playlist = null; S.sub = null; render(); $('#content').scrollTop = 0; }
function openDetail(kind, val) {
  if (!(S.folder || S.playlist || S.sub)) pushLayer('detail', () => { S.folder = null; S.playlist = null; S.sub = null; render(); });
  S.folder = kind === 'folder' ? val : null; S.playlist = kind === 'playlist' ? val : null; S.sub = kind === 'sub' ? val : null;
  render(); $('#content').scrollTop = 0;
}
function closeDetail() { dropLayer('detail'); S.folder = null; S.playlist = null; S.sub = null; render(); }
function openHistory() { openDetail('sub', 'history'); }
function openSearch() { $('.tb-main').classList.add('hidden'); $('.tb-search').classList.remove('hidden'); S.search = ''; const i = $('#searchInput'); i.value = ''; i.focus(); }
function closeSearch(silent) { $('.tb-main').classList.remove('hidden'); $('.tb-search').classList.add('hidden'); if (S.search !== null) { S.search = null; if (!silent) render(); } }

$('#bottomnav').addEventListener('click', e => { const b = e.target.closest('button'); if (b) Liquid.slide(() => go(b.dataset.nav)); });
$('#tabs').addEventListener('click', e => { const b = e.target.closest('.tab'); if (!b) return; const key = $('#tabs').dataset.key; if (key) Liquid.slide(() => { S.tab[key] = +b.dataset.tab; render(); $('#content').scrollTop = 0; }); });
$('#btnSearch').onclick = openSearch;
$('#searchBack').onclick = () => closeSearch();
$('#searchClear').onclick = () => { $('#searchInput').value = ''; S.search = ''; render(); $('#searchInput').focus(); };
$('#searchInput').addEventListener('input', e => { S.search = e.target.value; render(); });
$('#btnMenu').onclick = mainMenu;
$('#btnResume').onclick = resumeLast;
$('#fab').onclick = () => {
  if (S.nav === 'audio') { const au = audios().sort(sorter); if (!au.length) return $('#fileAudio').click(); return playQueue(au.map(m => m.id), P.shuffle ? Math.floor(Math.random() * au.length) : 0); }
  const vids = videos(); if (!vids.length) return $('#fileVideo').click();
  const last = lastPlayed('video'); if (last) return playFrom(last.id);
  const flat = videoEntries(vids).flatMap(e => e.type === 'group' ? e.items : [e.m]); playQueue(flat.map(m => m.id), 0);
};
$('#fileVideo').addEventListener('change', e => { addFiles(e.target.files, 'video'); e.target.value = ''; });
$('#fileAudio').addEventListener('change', e => { addFiles(e.target.files, 'audio'); e.target.value = ''; });
$('#fileDir').addEventListener('change', e => { const items = SRC.fromFolderInput(e.target.files); e.target.value = ''; if (!items.length) return toast('Is folder mein koi video/audio nahi mila', 3500); addFiles(items, null, { label: `📂 ${items.length} videos mile` }); });

function currentQueueFor(row) {
  const list = row.parentElement; const ids = $$(':scope > .row[data-kind=media]', list).map(r => r.dataset.id);
  return ids.length ? ids : [row.dataset.id];
}
$('#content').addEventListener('click', async e => {
  const seg = e.target.closest('[data-set]'); if (seg) return setOpt(seg.dataset.set, seg.dataset.val);
  const act = e.target.closest('[data-act]'); const row = e.target.closest('.row');
  if (act && act.dataset.act === 'menu' && row) {
    e.stopPropagation();
    if (row.dataset.kind === 'media') { const m = byId(row.dataset.id); const ctx = { queue: currentQueueFor(row) }; if (S.playlist && row.dataset.pidx !== undefined) { ctx.pid = S.playlist; ctx.pidx = +row.dataset.pidx; } return mediaMenu(m, ctx); }
    if (row.dataset.kind === 'group') { const g = videoEntries(videos()).find(x => x.type === 'group' && x.key === row.dataset.key); return groupMenu(g); }
    if (row.dataset.kind === 'playlist') return playlistMenu(S.playlists.find(p => p.id === row.dataset.pid));
  }
  if (act) {
    const a = act.dataset.act;
    if (a === 'add-video') return $('#fileVideo').click();
    if (a === 'scan-folder') return scanFolder();
    if (a === 'refresh-access') { for (const d of S.dirs.filter(d => d.perm !== 'granted')) await rescanDir(d, { ask: true }); return; }
    if (a === 'rescan') { const d = S.dirs.find(x => x.id === act.dataset.dir); return d && rescanDir(d, { ask: true }); }
    if (a === 'unlink-dir') return unlinkDir(act.dataset.dir);
    if (a === 'add-audio') return $('#fileAudio').click();
    if (a === 'new-playlist') return promptSheet('New playlist', 'My playlist', async v => { const p = { id: uid(), name: v, items: [], created: Date.now() }; S.playlists.push(p); await DB.put('playlists', p).catch(() => {}); render(); toast(`Playlist “${v}” created`); }, 'Create');
    if (a === 'pl-play' || a === 'pl-shuffle') return playPlaylist(S.playlists.find(p => p.id === S.playlist), a === 'pl-shuffle');
    if (a === 'history') return openHistory();
    if (a === 'clear-history') { for (const m of S.media) if (m.lastPlayed) { m.lastPlayed = 0; m.pos = 0; await saveMedia(m); } localStorage.removeItem('vlc-last'); render(); return toast('History cleared'); }
    if (a === 'sort') return sortSheet();
    if (a === 'shortcuts') return shortcutsSheet();
    if (a === 'about') return aboutSheet();
    if (a === 'storage') { const t = $('#storageTxt'); if (navigator.storage && navigator.storage.estimate) { const est = await navigator.storage.estimate(); t.textContent = `${size(est.usage || 0)} used of ${size(est.quota || 0)} available • ${S.media.length} files`; } else t.textContent = `${S.media.length} files`; return; }
    if (a === 'clear-lib') return openSheet(`<div class="sh-h">Clear library?</div><div class="sh-body">This removes all ${S.media.length} videos/songs and ${S.playlists.length} playlists from this app (your original files on the phone are not touched).</div><div class="sh-actions"><button class="btn ghost" data-sa="no">Cancel</button><button class="btn" data-sa="yes">Clear</button></div>`,
      onSheet({ no: closeSheet, yes: async () => { closeSheet(); stopPlayback(); await DB.clear('media').catch(() => {}); await DB.clear('blobs').catch(() => {}); await DB.clear('playlists').catch(() => {}); await DB.clear('dirs').catch(() => {}); S.media = []; S.playlists = []; S.dirs = []; blobCache.clear(); localStorage.removeItem('vlc-last'); render(); toast('Library cleared'); } }));
  }
  if (!row) return;
  if (row.dataset.kind === 'media') {
    const ids = currentQueueFor(row);
    if (S.playlist && row.dataset.pidx !== undefined) { const p = S.playlists.find(x => x.id === S.playlist); return playQueue(p.items.filter(byId), p.items.filter(byId).indexOf(row.dataset.id)); }
    return playQueue(ids, ids.indexOf(row.dataset.id));
  }
  if (row.dataset.kind === 'group') return openDetail('folder', row.dataset.key);
  if (row.dataset.kind === 'playlist') return openDetail('playlist', row.dataset.pid);
});
$('#content').addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.row,.set')) { e.preventDefault(); e.target.click(); } });
function lastPlayed(kind) { const id = localStorage.getItem('vlc-last'); let m = id && byId(id); if (m && (!kind || m.kind === kind)) return m; const arr = S.media.filter(x => x.lastPlayed && (!kind || x.kind === kind)).sort((a, b) => b.lastPlayed - a.lastPlayed); return arr[0] || null; }
function resumeLast() { const m = lastPlayed(); if (!m) return toast(S.media.length ? 'Nothing played yet — tap a video' : 'Add videos first (⋮ → Add videos)'); playFrom(m.id); }
function playPlaylist(p, shuffle) { const ids = p.items.filter(byId); if (!ids.length) return toast('Playlist is empty'); P.shuffle = !!shuffle; playQueue(ids, shuffle ? Math.floor(Math.random() * ids.length) : 0); }
function playFrom(id, queue, opts) { const m = byId(id); if (!m) return; let q = queue && queue.includes(id) ? queue : null; if (!q) { q = (m.kind === 'audio' ? audios().sort(sorter) : videoEntries(videos()).flatMap(e => e.type === 'group' ? e.items : [e.m])).map(x => x.id); } playQueue(q, q.indexOf(id), opts); }

/* ================= PLAYER ================= */
I.fullx = P_('M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z');
I.mute = P_('M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.8 8.8 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z');
const pv = $('#pv'), player = $('#player'), pctl = $('#pctl');
const P = { queue: [], idx: 0, cur: null, url: null, loop: 'off', shuffle: false, A: null, B: null, sleepT: null, sleepEnd: 0, sleepEOV: false, speed: 1, bright: 1, aspect: 0,
  locked: false, ctx: null, open: false, lastSave: 0, hideT: null, trackURL: null, subsOn: true, seeking: false };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
let relinkTarget = null;

function playQueue(ids, idx, opts) { ids = ids.filter(byId); if (!ids.length) return; P.queue = ids; P.idx = clamp(idx < 0 ? 0 : idx, 0, ids.length - 1); loadCurrent(opts || {}); }
async function loadCurrent(opts = {}) {
  const m = byId(P.queue[P.idx]); if (!m) return;
  if (P.cur && P.cur !== m) savePos();
  let blob = blobCache.get(m.id);
  if (!blob) { try { blob = await DB.get('blobs', m.id); } catch (e) {} if (blob) blobCache.set(m.id, blob); }
  if (!blob && m.src) { const d = S.dirs.find(x => x.id === m.src); if (d) { try { if (await SRC.permission(d.handle, true) === 'granted') { d.perm = 'granted'; blob = await SRC.fileAt(d.handle, m.rel); blobCache.set(m.id, blob); } } catch (e) {} } }
  if (!blob) { relinkTarget = m; toast(`“${m.name}” was not saved on this phone — choose the file again`, 7000, 'Choose', () => $('#fileRelink').click()); return; }
  P.cur = m; P.A = P.B = null;
  if (P.url) URL.revokeObjectURL(P.url);
  P.url = URL.createObjectURL(blob);
  $$('track', pv).forEach(t => t.remove()); $('#subLine').innerHTML = '';
  pv.defaultPlaybackRate = P.speed; pv.src = P.url; pv.playbackRate = P.speed;
  if (m.sub) attachSub(m.sub, m.subName);
  const resume = !opts.fromStart && m.pos > 3 && m.duration && m.pos < m.duration - 3;
  pv.addEventListener('loadedmetadata', () => {
    if (resume) { pv.currentTime = m.pos; toast(`Resumed at ${fmt(m.pos)}`, 4000, 'Start over', () => { pv.currentTime = 0; }); }
    pv.playbackRate = P.speed;
    if (!m.duration && isFinite(pv.duration)) { m.duration = pv.duration; saveMedia(m); }
  }, { once: true });
  m.lastPlayed = Date.now(); localStorage.setItem('vlc-last', m.id); saveMedia(m);
  $('#pTitle').textContent = m.name;
  $('#pSub').textContent = subOf(m) + (P.queue.length > 1 ? `  •  ${P.idx + 1}/${P.queue.length}` : '');
  const art = $('#audioArt'); art.classList.toggle('hidden', m.kind !== 'audio');
  if (m.kind === 'audio') art.innerHTML = `<div class="disc"><span style="width:56px;height:56px;color:#ff8800">${I.note}</span></div>`;
  showPlayer(); updateBadges(); setMediaSession(m); updateMini();
  if (SET.boost !== 100 || SET.eq.some(v => v)) ensureAudio();
  if (P.ctx && P.ctx.state === 'suspended') P.ctx.resume().catch(() => {});
  pv.play().catch(() => showControls());
}
$('#fileRelink').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = ''; const m = relinkTarget; if (!f || !m) return;
  blobCache.set(m.id, f); m.size = f.size; try { await DB.put('blobs', f, m.id); m.hasBlob = true; } catch (err) { m.hasBlob = false; }
  await saveMedia(m); playFrom(m.id, P.queue);
});
function showPlayer() {
  if (!P.open) { P.open = true; player.classList.remove('hidden'); root.classList.add('player-open'); pushLayer('player', () => leavePlayer()); }
  $('#mini').classList.add('hidden'); root.classList.remove('has-mini'); showControls();
}
function leavePlayer() {
  P.open = false; player.classList.add('hidden'); root.classList.remove('player-open');
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  if (screen.orientation && screen.orientation.unlock) try { screen.orientation.unlock(); } catch (e) {}
  player.classList.remove('rot');
  if (!SET.bgAudio) pv.pause();
  savePos();
  if (P.cur && !pv.ended) { $('#mini').classList.remove('hidden'); root.classList.add('has-mini'); updateMini(); }
  render();
}
function closePlayerUI() { if (!P.open) return; dropLayer('player'); leavePlayer(); }
function stopPlayback() {
  if (!P.cur) return;
  pv.pause(); savePos(); P.cur = null; pv.removeAttribute('src'); try { pv.load(); } catch (e) {}
  $('#mini').classList.add('hidden'); root.classList.remove('has-mini'); setSleep(0, true);
  if (P.open) closePlayerUI();
}
function savePos() {
  const m = P.cur; if (!m) return;
  const t = pv.currentTime || 0; const d = pv.duration || m.duration || 0;
  m.pos = (pv.ended || (d && t > d - 2)) ? 0 : t; m.lastPlayed = Date.now(); saveMedia(m);
}
function updateMini() {
  const m = P.cur; if (!m) return;
  const u = thumbURL.get(m.id); $('#mini .mini-thumb').innerHTML = u ? `<img src="${u}" alt="">` : `<div class="thumb"><div class="ph">${m.kind === 'audio' ? I.note : I.clap}</div></div>`;
  $('#mini .mini-title').textContent = m.name; $('#mini .mini-sub').textContent = `${fmt(pv.currentTime)} / ${fmt(pv.duration || m.duration)}`;
  $('#mini .mini-play').innerHTML = pv.paused ? I.play : I.pause;
  $('#mini .mini-prog i').style.width = (pv.duration ? pv.currentTime / pv.duration * 100 : 0) + '%';
}
$('#mini').addEventListener('click', e => {
  if (e.target.closest('.mini-play')) { e.stopPropagation(); return togglePlay(); }
  if (e.target.closest('.mini-close')) { e.stopPropagation(); return stopPlayback(); }
  showPlayer();
});

/* ---- time / play state ---- */
function updateTime() {
  const d = pv.duration || (P.cur && P.cur.duration) || 0, t = pv.currentTime || 0;
  if (!P.seeking) { $('#pCur').textContent = fmt(t); const s = $('#pSeek'); s.value = d ? Math.round(t / d * 1000) : 0; s.style.setProperty('--p', (d ? t / d * 100 : 0) + '%'); }
  $('#pDur').textContent = fmt(d);
}
pv.addEventListener('timeupdate', () => {
  updateTime();
  if (P.A != null && P.B != null && pv.currentTime >= P.B) pv.currentTime = P.A;
  if (Date.now() - P.lastSave > 3000) { P.lastSave = Date.now(); savePos(); }
  if (!$('#mini').classList.contains('hidden')) updateMini();
});
pv.addEventListener('loadedmetadata', updateTime);
const syncPlay = () => {
  const playing = !pv.paused; $('#pPlay').innerHTML = playing ? I.pause : I.play; $('#audioArt').classList.toggle('playing', playing);
  if ('mediaSession' in navigator) navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
  updateMini(); if (playing) showControls(); else { clearTimeout(P.hideT); if (!P.locked) pctl.classList.remove('off'); savePos(); }
};
pv.addEventListener('play', syncPlay); pv.addEventListener('pause', syncPlay);
pv.addEventListener('error', () => { if (pv.getAttribute('src')) toast('This file can\'t be played in this browser (format/codec not supported)', 5000); });
pv.addEventListener('ended', () => {
  if (P.cur) { P.cur.pos = 0; saveMedia(P.cur); }
  if (P.sleepEOV) { setSleep(0, true); toast('Sleep timer: stopped at end of video'); return; }
  if (P.loop === 'one') { pv.currentTime = 0; pv.play().catch(() => {}); return; }
  if (!next(true)) { showControls(); updateMini(); }
});
function togglePlay() { if (!P.cur) return; if (pv.paused) { if (P.ctx && P.ctx.state === 'suspended') P.ctx.resume(); pv.play().catch(() => {}); } else pv.pause(); }
function skip(s) { if (!P.cur) return; const d = pv.duration || 0; pv.currentTime = clamp(pv.currentTime + s, 0, d || 1e9); updateTime(); }
function next(auto) {
  const n = P.queue.length; if (!n) return false; let i;
  if (P.shuffle && n > 1) { do { i = Math.floor(Math.random() * n); } while (i === P.idx); }
  else { i = P.idx + 1; if (i >= n) { if (P.loop === 'all') i = 0; else { if (!auto) toast('End of list'); return false; } } }
  P.idx = i; loadCurrent({ fromStart: true }); return true;
}
function prev() {
  if (pv.currentTime > 3 || P.queue.length < 2) { pv.currentTime = 0; return; }
  let i = P.idx - 1; if (i < 0) i = P.loop === 'all' ? P.queue.length - 1 : 0; P.idx = i; loadCurrent({ fromStart: true });
}
const seek = $('#pSeek');
seek.addEventListener('input', () => { P.seeking = true; const d = pv.duration || 0; $('#pCur').textContent = fmt(seek.value / 1000 * d); seek.style.setProperty('--p', seek.value / 10 + '%'); showControls(); });
seek.addEventListener('change', () => { const d = pv.duration || 0; pv.currentTime = seek.value / 1000 * d; P.seeking = false; updateTime(); });

/* ---- controls visibility / lock ---- */
function showControls() {
  if (P.locked) return flashUnlock();
  pctl.classList.remove('off'); clearTimeout(P.hideT);
  if (!pv.paused) P.hideT = setTimeout(() => { if (!sheetOpen) pctl.classList.add('off'); }, 3500);
}
function toggleControls() { if (P.locked) return flashUnlock(); if (pctl.classList.contains('off')) showControls(); else { clearTimeout(P.hideT); pctl.classList.add('off'); } }
let unlockT;
function flashUnlock() { const b = $('#pUnlock'); b.classList.remove('hidden'); clearTimeout(unlockT); unlockT = setTimeout(() => b.classList.add('hidden'), 2500); }
pctl.addEventListener('pointerdown', e => { if (e.target.closest('button,input')) showControls(); });
function setLock(on) { P.locked = on; if (on) { clearTimeout(P.hideT); pctl.classList.add('off'); flashUnlock(); toast('Screen locked — tap the lock to unlock'); } else { $('#pUnlock').classList.add('hidden'); showControls(); toast('Unlocked'); } }

/* ---- gestures: brightness / volume / seek swipes, double-tap ±10 s ---- */
const gest = $('#gest'), ind = $('#ind'), seekHint = $('#seekHint');
let G = null, lastTap = 0, lastZone = '', tapT = null, indT = null;
function showInd(icon, frac, txt) { ind.classList.remove('hidden'); $('.ind-ic', ind).innerHTML = icon; $('.ind-bar i', ind).style.width = clamp(frac, 0, 1) * 100 + '%'; $('.ind-txt', ind).textContent = txt; clearTimeout(indT); indT = setTimeout(() => ind.classList.add('hidden'), 900); }
function flash(sel) { const el = $(sel); el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 450); }
gest.addEventListener('pointerdown', e => {
  G = { x: e.clientX, y: e.clientY, t: Date.now(), w: gest.clientWidth, h: gest.clientHeight, mode: null, vol: pv.volume, bright: P.bright, time: pv.currentTime, target: null };
  try { gest.setPointerCapture(e.pointerId); } catch (err) {}
});
gest.addEventListener('pointermove', e => {
  if (!G || P.locked) return; const dx = e.clientX - G.x, dy = e.clientY - G.y;
  if (!G.mode) { if (Math.abs(dx) > 14 || Math.abs(dy) > 14) G.mode = Math.abs(dx) > Math.abs(dy) ? 'seek' : (G.x < G.w / 2 ? 'bright' : 'vol'); else return; }
  if (G.mode === 'bright') { P.bright = clamp(G.bright - dy / (G.h * 0.5), 0.15, 1.5); pv.style.filter = P.bright === 1 ? '' : `brightness(${P.bright})`; showInd(I.sun, (P.bright - 0.15) / 1.35, 'Brightness ' + Math.round(P.bright * 100) + '%'); }
  else if (G.mode === 'vol') { const v = clamp(G.vol - dy / (G.h * 0.5), 0, 1); pv.volume = v; pv.muted = v === 0; showInd(v ? I.vol : I.mute, v, 'Volume ' + Math.round(v * 100) + '%'); }
  else { const d = pv.duration || 0; const delta = dx / G.w * Math.min(d, 180); G.target = clamp(G.time + delta, 0, d); seekHint.textContent = `${delta >= 0 ? '+' : '−'}${fmt(Math.abs(delta))}  [${fmt(G.target)}]`; seekHint.classList.remove('hidden'); }
});
gest.addEventListener('pointerup', e => {
  if (!G) return; const g = G; G = null; seekHint.classList.add('hidden');
  if (g.mode === 'seek' && g.target != null) { pv.currentTime = g.target; updateTime(); return; }
  if (g.mode) return;
  if (Date.now() - g.t > 600) return;
  if (P.locked) return flashUnlock();
  const now = Date.now(); const zone = g.x < g.w * 0.38 ? 'L' : g.x > g.w * 0.62 ? 'R' : 'C';
  if (now - lastTap < 300 && zone === lastZone) {
    clearTimeout(tapT); lastTap = 0;
    if (zone === 'L') { skip(-10); flash('#dblL'); } else if (zone === 'R') { skip(10); flash('#dblR'); } else togglePlay();
    return;
  }
  lastTap = now; lastZone = zone; clearTimeout(tapT); tapT = setTimeout(toggleControls, 300);
});
gest.addEventListener('pointercancel', () => { G = null; seekHint.classList.add('hidden'); });
gest.addEventListener('wheel', e => { e.preventDefault(); if (P.locked) return; const v = clamp(pv.volume - Math.sign(e.deltaY) * 0.05, 0, 1); pv.volume = v; pv.muted = v === 0; showInd(v ? I.vol : I.mute, v, 'Volume ' + Math.round(v * 100) + '%'); }, { passive: false });

/* ---- player features ---- */
const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4];
function setSpeed(v, say) { P.speed = Math.round(clamp(v, 0.25, 4) * 100) / 100; pv.defaultPlaybackRate = P.speed; pv.playbackRate = P.speed; $('#pSpeed').textContent = P.speed + 'x'; $('#pSpeed').classList.toggle('on', P.speed !== 1); if (say) toast(`Speed ${P.speed}x`, 1200); }
function speedSheet() {
  openSheet(`<div class="sh-h">Playback speed</div><div class="chips">${SPEEDS.map(s => `<button class="chip ${s === P.speed ? 'on' : ''}" data-sa="sp" data-v="${s}">${s}x</button>`).join('')}</div>
  <div class="sl"><label>Custom</label><input type="range" min="0.25" max="4" step="0.05" value="${P.speed}" id="spR" aria-label="Custom speed"><output id="spO">${P.speed}x</output></div>`, el => {
    onSheet({ sp: b => { setSpeed(+b.dataset.v); closeSheet(); } })(el);
    $('#spR', el).addEventListener('input', e => { setSpeed(+e.target.value); $('#spO', el).textContent = P.speed + 'x'; $$('.chip', el).forEach(c => c.classList.toggle('on', +c.dataset.v === P.speed)); });
  });
}
function setSleep(min, silent) {
  clearTimeout(P.sleepT); P.sleepEnd = 0; P.sleepEOV = false;
  if (min === 'eov') P.sleepEOV = true;
  else if (min > 0) { P.sleepEnd = Date.now() + min * 60000; P.sleepT = setTimeout(() => { pv.pause(); P.sleepEnd = 0; updateBadges(); toast('Sleep timer: paused'); }, min * 60000); }
  updateBadges();
  if (!silent) toast(min === 'eov' ? 'Will stop at end of this video' : min > 0 ? `Sleep timer: ${min} min` : 'Sleep timer off');
}
function sleepSheet() {
  const opts = [[0, 'Off'], [5, '5 min'], [10, '10 min'], [15, '15 min'], [30, '30 min'], [45, '45 min'], [60, '1 hour'], ['eov', 'End of video']];
  const curTxt = P.sleepEnd ? `Pauses in ${fmt((P.sleepEnd - Date.now()) / 1000)}` : P.sleepEOV ? 'Stops at end of video' : 'Off';
  openSheet(`<div class="sh-h">Sleep timer <small>&nbsp;${curTxt}</small></div><div class="chips">${opts.map(([v, l]) => `<button class="chip" data-sa="s" data-v="${v}">${l}</button>`).join('')}</div>`,
    onSheet({ s: b => { const v = b.dataset.v; setSleep(v === 'eov' ? 'eov' : +v); closeSheet(); } }));
}
function abStep() {
  if (!P.cur) return;
  if (P.A == null) { P.A = pv.currentTime; toast(`A-B repeat: A set at ${fmt(P.A)} — now set B`); }
  else if (P.B == null) { if (pv.currentTime <= P.A + 0.5) return toast('B must be after A'); P.B = pv.currentTime; pv.currentTime = P.A; toast(`Repeating ${fmt(P.A)} – ${fmt(P.B)}`); }
  else { P.A = P.B = null; toast('A-B repeat off'); }
  updateBadges();
}
function cycleLoop() { P.loop = { off: 'all', all: 'one', one: 'off' }[P.loop]; updateBadges(); toast({ off: 'Loop off', all: 'Loop all', one: 'Loop this video' }[P.loop], 1500); }
function updateBadges() {
  const ab = $('#bAB'); ab.classList.toggle('hidden', P.A == null); ab.textContent = P.A == null ? '' : P.B == null ? `A ${fmt(P.A)} → B ?` : `A-B ${fmt(P.A)}–${fmt(P.B)}`;
  const lp = $('#bLoop'); lp.classList.toggle('hidden', P.loop === 'off' && !P.shuffle); lp.textContent = [P.loop === 'all' ? 'Loop all' : P.loop === 'one' ? 'Loop one' : '', P.shuffle ? 'Shuffle' : ''].filter(Boolean).join(' • ');
  const sl = $('#bSleep'); sl.classList.toggle('hidden', !P.sleepEnd && !P.sleepEOV); sl.textContent = P.sleepEnd ? `Sleep ${fmt((P.sleepEnd - Date.now()) / 1000)}` : P.sleepEOV ? 'Sleep: end of video' : '';
  const eq = $('#bEq'); const eqOn = SET.eq.some(v => v) || SET.boost !== 100; eq.classList.toggle('hidden', !eqOn); eq.textContent = [SET.eq.some(v => v) ? 'EQ ' + SET.eqPreset : '', SET.boost !== 100 ? `Boost ${SET.boost}%` : ''].filter(Boolean).join(' • ');
  $('#pLoop').innerHTML = P.loop === 'one' ? I.repeat1 : I.repeat; $('#pLoop').classList.toggle('on', P.loop !== 'off');
}
setInterval(() => { if (P.sleepEnd) updateBadges(); }, 1000);

/* ---- equalizer + audio boost (Web Audio API) ---- */
const EQF = [60, 230, 910, 3600, 14000];
const PRESETS = { Flat: [0, 0, 0, 0, 0], 'Bass boost': [8, 5, 1, 0, 0], Pop: [-1, 2, 4, 2, -1], Rock: [5, 3, -1, 3, 5], Vocal: [-3, 0, 4, 3, 0], Treble: [0, 0, 0, 4, 8], Classical: [4, 2, -1, 2, 4] };
function ensureAudio() {
  if (P.ctx) { if (P.ctx.state === 'suspended') P.ctx.resume().catch(() => {}); return true; }
  try {
    const C = window.AudioContext || window.webkitAudioContext; P.ctx = new C();
    P.src = P.ctx.createMediaElementSource(pv);
    P.bands = EQF.map((f, i) => { const b = P.ctx.createBiquadFilter(); b.type = i === 0 ? 'lowshelf' : i === EQF.length - 1 ? 'highshelf' : 'peaking'; b.frequency.value = f; b.Q.value = 1.1; return b; });
    P.gain = P.ctx.createGain();
    let node = P.src; for (const b of P.bands) { node.connect(b); node = b; } node.connect(P.gain); P.gain.connect(P.ctx.destination);
    applyAudio(); if (P.ctx.state === 'suspended') P.ctx.resume().catch(() => {});
    return true;
  } catch (e) { toast('Equalizer is not supported in this browser'); return false; }
}
function applyAudio() { if (!P.ctx) return; P.bands.forEach((b, i) => { b.gain.value = SET.eq[i] || 0; }); P.gain.gain.value = SET.boost / 100; updateBadges(); }
function eqSheet() {
  const band = (f, i) => `<div class="sl"><label>${f >= 1000 ? f / 1000 + ' kHz' : f + ' Hz'}</label><input type="range" min="-12" max="12" step="1" value="${SET.eq[i]}" data-band="${i}" aria-label="${f} Hz"><output>${SET.eq[i] > 0 ? '+' : ''}${SET.eq[i]} dB</output></div>`;
  openSheet(`<div class="sh-h">Equalizer</div><div class="chips">${Object.keys(PRESETS).map(n => `<button class="chip ${SET.eqPreset === n ? 'on' : ''}" data-sa="pr" data-n="${n}">${n}</button>`).join('')}</div>${EQF.map(band).join('')}
  <div class="sl"><label>Boost</label><input type="range" min="100" max="200" step="5" value="${SET.boost}" id="boostR" aria-label="Audio boost"><output id="boostO">${SET.boost}%</output></div><div class="sh-body" style="font-size:12.5px">Boost above 100% makes quiet videos louder (up to 200%).</div>`, el => {
    onSheet({ pr: b => { ensureAudio(); SET.eq = PRESETS[b.dataset.n].slice(); SET.eqPreset = b.dataset.n; saveSet(); applyAudio(); eqSheet(); } })(el);
    $$('input[data-band]', el).forEach(inp => inp.addEventListener('input', () => { ensureAudio(); const i = +inp.dataset.band; SET.eq[i] = +inp.value; SET.eqPreset = 'Custom'; saveSet(); applyAudio(); inp.nextElementSibling.textContent = `${inp.value > 0 ? '+' : ''}${inp.value} dB`; $$('.chip', el).forEach(c => c.classList.remove('on')); }));
    $('#boostR', el).addEventListener('input', e => { ensureAudio(); SET.boost = +e.target.value; saveSet(); applyAudio(); $('#boostO', el).textContent = SET.boost + '%'; });
  });
}
function boostSheet() {
  openSheet(`<div class="sh-h">Audio boost</div><div class="sl"><label>Volume</label><input type="range" min="100" max="200" step="5" value="${SET.boost}" id="boostR2" aria-label="Audio boost"><output id="boostO2">${SET.boost}%</output></div><div class="chips">${[100, 125, 150, 175, 200].map(v => `<button class="chip ${SET.boost === v ? 'on' : ''}" data-sa="b" data-v="${v}">${v}%</button>`).join('')}</div>`, el => {
    onSheet({ b: x => { ensureAudio(); SET.boost = +x.dataset.v; saveSet(); applyAudio(); closeSheet(); toast(`Audio boost ${SET.boost}%`); } })(el);
    $('#boostR2', el).addEventListener('input', e => { ensureAudio(); SET.boost = +e.target.value; saveSet(); applyAudio(); $('#boostO2', el).textContent = SET.boost + '%'; });
  });
}

/* ---- subtitles (.srt converted to .vtt in the browser) ---- */
function srtToVtt(t) { t = t.replace(/^\uFEFF/, '').replace(/\r+/g, ''); if (/^WEBVTT/.test(t)) return t; return 'WEBVTT\n\n' + t.replace(/(\d{1,2}:\d{2}:\d{2}),(\d{1,3})/g, '$1.$2'); }
function attachSub(vtt, name) {
  $$('track', pv).forEach(t => t.remove()); if (P.trackURL) URL.revokeObjectURL(P.trackURL);
  P.trackURL = URL.createObjectURL(new Blob([vtt], { type: 'text/vtt' }));
  const tr = document.createElement('track'); tr.kind = 'subtitles'; tr.label = name || 'Subtitles'; tr.srclang = 'en'; tr.src = P.trackURL; tr.default = true; pv.appendChild(tr);
  const show = () => { for (const t of pv.textTracks) { t.mode = 'hidden'; t.oncuechange = drawSub; } drawSub(); };
  tr.addEventListener('load', show); setTimeout(show, 60);
}
/* subtitles are drawn by us (above the controls, same on every browser) */
function drawSub() {
  const el = $('#subLine'); const t = pv.textTracks[0];
  const txt = P.subsOn && t && t.activeCues ? [...t.activeCues].map(c => c.text.replace(/<[^>]+>/g, '')).join('\n') : '';
  el.innerHTML = txt ? `<span>${esc(txt)}</span>` : '';
}
$('#fileSub').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f || !P.cur) return;
  const vtt = srtToVtt(await f.text()); P.cur.sub = vtt; P.cur.subName = f.name; P.subsOn = true; await saveMedia(P.cur);
  attachSub(vtt, f.name); toast(`Subtitles loaded: ${f.name}`);
});
function subsSheet() {
  const m = P.cur; const has = m && m.sub;
  openSheet(`<div class="sh-h">Subtitles${has ? ` <small>&nbsp;${esc(m.subName)}</small>` : ''}</div>` + item('load', I.upload || I.add, 'Load subtitle file (.srt / .vtt)')
    + (has ? item('toggle', I.cc, 'Show subtitles', P.subsOn ? 'On' : 'Off') + item('rm', I.del, 'Remove subtitles') : '')
    + `<div class="sh-body" style="padding-bottom:4px">Size</div><div class="chips">${[[14, 'Small'], [18, 'Medium'], [24, 'Large'], [30, 'Huge']].map(([v, l]) => `<button class="chip ${SET.subSize === v ? 'on' : ''}" data-sa="sz" data-v="${v}">${l}</button>`).join('')}</div>`,
  onSheet({
    load: () => { closeSheet(); $('#fileSub').click(); },
    toggle: () => { P.subsOn = !P.subsOn; drawSub(); closeSheet(); toast(P.subsOn ? 'Subtitles on' : 'Subtitles off'); },
    rm: async () => { m.sub = null; m.subName = null; await saveMedia(m); $$('track', pv).forEach(t => t.remove()); for (const t of pv.textTracks) t.mode = 'disabled'; $('#subLine').innerHTML = ''; closeSheet(); toast('Subtitles removed'); },
    sz: b => { SET.subSize = +b.dataset.v; saveSet(); applyRootAttrs(); subsSheet(); },
  }));
}
I.upload = P_('M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z');

/* ---- screenshot, PiP, aspect, rotate, fullscreen ---- */
function snapshot() {
  if (!P.cur || P.cur.kind === 'audio' || !pv.videoWidth) return toast('No video frame to capture');
  const c = document.createElement('canvas'); c.width = pv.videoWidth; c.height = pv.videoHeight; const x = c.getContext('2d');
  if (P.bright !== 1 && 'filter' in x) x.filter = `brightness(${P.bright})`;
  x.drawImage(pv, 0, 0);
  c.toBlob(b => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(b);
    a.download = `VLC_Pro_snapshot_${P.cur.name.replace(/[^\w-]+/g, '_').slice(0, 40)}_${fmt(pv.currentTime).replace(/:/g, '-')}.png`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    P.lastShot = { name: a.download, size: b.size }; flash('#dblL'); toast('Screenshot saved • ' + a.download, 3000);
  }, 'image/png');
}
async function pip() {
  try {
    if (document.pictureInPictureElement) { await document.exitPictureInPicture(); return; }
    if (!document.pictureInPictureEnabled || !pv.requestPictureInPicture) return toast('Picture-in-picture is not supported in this browser');
    if (!P.cur || P.cur.kind === 'audio') return toast('Picture-in-picture works with videos');
    await pv.requestPictureInPicture(); toast('Picture-in-picture on');
  } catch (e) { toast('Picture-in-picture not available here'); }
}
const ASPECTS = [['', 'Best fit'], ['fill', 'Fill screen (crop)'], ['stretch', 'Stretch'], ['r169', '16:9'], ['r43', '4:3']];
function setAspect(i) { P.aspect = (i + ASPECTS.length) % ASPECTS.length; pv.className = ASPECTS[P.aspect][0]; toast('Aspect: ' + ASPECTS[P.aspect][1], 1400); }
function aspectSheet() { openSheet(`<div class="sh-h">Aspect ratio</div>` + ASPECTS.map(([c, l], i) => item('a', i === P.aspect ? I.check : I.blank, l, '', '', `data-i="${i}"`)).join(''), onSheet({ a: b => { setAspect(+b.dataset.i); closeSheet(); } })); }
async function rotate() {
  const o = screen.orientation;
  try {
    if (!o || !o.lock) throw new Error('no lock');
    if (!document.fullscreenElement) await player.requestFullscreen();
    const toLand = o.type.startsWith('portrait'); await o.lock(toLand ? 'landscape' : 'portrait'); toast(toLand ? 'Landscape' : 'Portrait', 1200);
  } catch (e) { player.classList.toggle('rot'); toast(player.classList.contains('rot') ? 'Rotated 90°' : 'Rotation reset', 1200); }
}
async function fullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (player.requestFullscreen) await player.requestFullscreen();
    else if (pv.webkitEnterFullscreen) pv.webkitEnterFullscreen();
  } catch (e) { toast('Fullscreen not available here'); }
}
document.addEventListener('fullscreenchange', () => { $('#pFull').innerHTML = document.fullscreenElement ? I.fullx : I.full; });
function playerMenu() {
  const sleepTxt = P.sleepEnd ? fmt((P.sleepEnd - Date.now()) / 1000) : P.sleepEOV ? 'End of video' : 'Off';
  const abTxt = P.A == null ? 'Set A' : P.B == null ? 'Set B' : 'Turn off';
  openSheet(item('speed', I.speed, 'Playback speed', P.speed + 'x') + item('sleep', I.timer, 'Sleep timer', sleepTxt) + item('ab', I.ab, 'A-B repeat', abTxt)
    + item('loop', P.loop === 'one' ? I.repeat1 : I.repeat, 'Loop', { off: 'Off', all: 'All', one: 'This video' }[P.loop]) + item('shuf', I.shuffle, 'Shuffle', P.shuffle ? 'On' : 'Off')
    + item('eq', I.eq, 'Equalizer', SET.eq.some(v => v) ? SET.eqPreset : 'Flat') + item('boost', I.boost, 'Audio boost', SET.boost + '%') + item('aspect', I.aspect, 'Aspect ratio', ASPECTS[P.aspect][1])
    + item('subs', I.cc, 'Subtitles', P.cur && P.cur.sub ? (P.subsOn ? 'On' : 'Off') : '') + item('shot', I.camera, 'Screenshot') + item('pip', I.pip, 'Picture-in-picture')
    + item('bg', I.bg, 'Background audio', SET.bgAudio ? 'On' : 'Off') + item('addpl', I.addlist, 'Add to playlist') + item('info', I.info, 'Information'),
  onSheet({
    speed: speedSheet, sleep: sleepSheet, ab: () => { closeSheet(); abStep(); }, loop: () => { cycleLoop(); playerMenu(); },
    shuf: () => { P.shuffle = !P.shuffle; updateBadges(); playerMenu(); toast(P.shuffle ? 'Shuffle on' : 'Shuffle off', 1200); }, eq: eqSheet, boost: boostSheet, aspect: aspectSheet, subs: subsSheet,
    shot: () => { closeSheet(); snapshot(); }, pip: () => { closeSheet(); pip(); },
    bg: () => { SET.bgAudio = !SET.bgAudio; saveSet(); playerMenu(); toast(SET.bgAudio ? 'Background audio on' : 'Background audio off'); },
    addpl: () => P.cur && addToPlaylistSheet([P.cur.id]), info: () => P.cur && infoSheet(P.cur),
  }));
}
function vol(d) { const v = clamp(pv.volume + d, 0, 1); pv.volume = v; pv.muted = v === 0; showInd(v ? I.vol : I.mute, v, 'Volume ' + Math.round(v * 100) + '%'); }

/* ---- buttons ---- */
const on = (id, fn) => $(id).addEventListener('click', e => { e.stopPropagation(); fn(e); });
on('#pBack', closePlayerUI); on('#pPlay', togglePlay); on('#pRew', () => { skip(-10); flash('#dblL'); }); on('#pFwd', () => { skip(10); flash('#dblR'); });
on('#pPrev', prev); on('#pNext', () => next(false)); on('#pLock', () => setLock(true)); on('#pUnlock', () => setLock(false));
on('#pRotate', rotate); on('#pAspect', () => setAspect(P.aspect + 1)); on('#pSpeed', speedSheet); on('#pLoop', cycleLoop); on('#pShot', snapshot); on('#pPip', pip); on('#pFull', fullscreen);
on('#pSubs', subsSheet); on('#pMore', playerMenu);

/* ---- media session (lock screen / notification controls) ---- */
function setMediaSession(m) {
  if (!('mediaSession' in navigator)) return;
  try {
    const art = thumbURL.get(m.id);
    navigator.mediaSession.metadata = new MediaMetadata({ title: m.name, artist: 'VLC Pro', album: m.kind === 'audio' ? 'Audio' : 'Video', artwork: art ? [{ src: art, sizes: '320x180', type: 'image/jpeg' }] : [] });
    const ms = navigator.mediaSession;
    [['play', () => pv.play()], ['pause', () => pv.pause()], ['seekbackward', () => skip(-10)], ['seekforward', () => skip(10)], ['previoustrack', prev], ['nexttrack', () => next(false)]].forEach(([a, f]) => { try { ms.setActionHandler(a, f); } catch (e) {} });
  } catch (e) {}
}
/* ---- background audio: pause when app hidden unless enabled ---- */
document.addEventListener('visibilitychange', () => { if (document.hidden) { savePos(); if (!SET.bgAudio && P.cur && !pv.paused && document.pictureInPictureElement !== pv) pv.pause(); } });
window.addEventListener('pagehide', savePos);

/* ---- keyboard shortcuts (desktop) ---- */
document.addEventListener('keydown', e => {
  if (e.target.matches && e.target.matches('input[type=text],input[type=search]')) { if (e.key === 'Escape') { if (sheetOpen) closeSheet(); else closeSearch(); } return; }
  if (sheetOpen) { if (e.key === 'Escape') closeSheet(); return; }
  if (!P.open) { if (e.key === '/') { e.preventDefault(); openSearch(); } return; }
  let h = true;
  switch (e.key) {
    case ' ': case 'k': case 'K': togglePlay(); break;
    case 'ArrowLeft': case 'j': case 'J': skip(-10); flash('#dblL'); break;
    case 'ArrowRight': case 'l': case 'L': skip(10); flash('#dblR'); break;
    case 'ArrowUp': vol(0.1); break; case 'ArrowDown': vol(-0.1); break;
    case 'm': case 'M': pv.muted = !pv.muted; showInd(pv.muted ? I.mute : I.vol, pv.muted ? 0 : pv.volume, pv.muted ? 'Muted' : 'Volume ' + Math.round(pv.volume * 100) + '%'); break;
    case 'f': case 'F': fullscreen(); break;
    case '[': setSpeed(P.speed - 0.25, true); break; case ']': setSpeed(P.speed + 0.25, true); break;
    case 'n': case 'N': next(false); break; case 'b': case 'B': prev(); break;
    case 's': case 'S': snapshot(); break; case 'p': case 'P': pip(); break; case 'a': case 'A': abStep(); break;
    case 'Escape': if (!document.fullscreenElement) closePlayerUI(); break;
    default: h = false;
  }
  if (h) { e.preventDefault(); if (!P.locked) showControls(); }
});

/* ================= INIT ================= */
function paintIcons() {
  $('#logo').innerHTML = CONE;
  const set = { '#tbBack': I.back, '#btnSearch': I.search, '#btnResume': I.resume, '#btnMenu': I.vmore, '#searchBack': I.back, '#searchClear': I.close, '#fab': I.play,
    '#pBack': I.back, '#pSubs': I.cc, '#pMore': I.vmore, '#pPrev': I.prev, '#pRew': I.rew10, '#pPlay': I.play, '#pFwd': I.fwd10, '#pNext': I.next,
    '#pLock': I.lock, '#pUnlock': I.unlock, '#pRotate': I.rotate, '#pAspect': I.aspect, '#pLoop': I.repeat, '#pShot': I.camera, '#pPip': I.pip, '#pFull': I.full,
    '.mini-play': I.play, '.mini-close': I.close };
  for (const [s, svg] of Object.entries(set)) { const el = $(s); if (el) el.innerHTML = svg; }
  const nav = { video: P_('M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z'), audio: I.note, browse: I.folder, playlists: I.plist, more: I.hmore };
  $$('#bottomnav button').forEach(b => { $('.ni', b).innerHTML = nav[b.dataset.nav]; });
}
async function init() {
  applyRootAttrs(); paintIcons();
  await DB.open();
  try { S.media = await DB.all('media'); S.playlists = await DB.all('playlists'); } catch (e) {}
  for (const m of S.media) if (m.thumb instanceof Blob) thumbURL.set(m.id, URL.createObjectURL(m.thumb));
  const nav = params.get('nav'); if (nav && ['video', 'audio', 'browse', 'playlists', 'more'].includes(nav)) S.nav = nav;
  render();
  restoreDirs();
}
window.VLC = { S, P, get SET() { return SET; }, addFiles, render, srtToVtt, videoEntries, Liquid, linkFolder, rescanDir, rescanAll, scanFolder, unlinkDir };
init();
})();
