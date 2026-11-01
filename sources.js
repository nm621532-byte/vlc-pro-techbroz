/* VLC Pro — sources.js
   Where media files come from. ALL file-source logic lives here so the same web app can later be wrapped
   as an Android APK (Capacitor) that plugs in a "native" source (READ_MEDIA_VIDEO permission + MediaStore scan).

   Sources:
   1. folder   — File System Access API: window.showDirectoryPicker({mode:'read'}). The folder handle is saved in
                 IndexedDB, so on every open the app re-checks permission and rescans for new / removed files.
                 (Desktop Chrome / Edge / Opera; feature-detected at runtime.)
   2. folderInput — <input type=file webkitdirectory multiple>: pick a whole folder once (DCIM, Movies, WhatsApp Video…).
   3. files    — the classic multi-select <input type=file accept=video/* multiple>.
   4. native   — pluggable: VLCSources.registerNative({ name, available(), scan(onProgress) }) where scan resolves to
                 [{ file: File, folder: 'Camera', rel: 'DCIM/Camera/x.mp4' }]. A Capacitor plugin named "VlcMedia"
                 is picked up automatically if it exists.
   Nothing here ever uploads anything: files are read only inside this browser. */
window.VLCSources = (() => {
  const VEXT = /\.(mp4|m4v|mkv|webm|mov|avi|3gp|3g2|ts|mts|m2ts|flv|wmv|ogv|mpg|mpeg)$/i;
  const AEXT = /\.(mp3|m4a|aac|ogg|oga|opus|wav|flac|amr|wma)$/i;
  const kind = (name, type = '') => (type.startsWith('audio/') || AEXT.test(name)) ? 'audio' : (type.startsWith('video/') || VEXT.test(name)) ? 'video' : null;
  const isMedia = (name, type) => !!kind(name, type);
  const fkey = f => `${f.name}|${f.size}|${f.lastModified || 0}`;          // dedupe key: name + size + lastModified
  const SKIP = /^(\.|Android$|\$RECYCLE|System Volume Information$)/;      // hidden / system folders are never scanned

  let native = null;
  function registerNative(src) { native = src; }
  try {
    const P = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.VlcMedia;
    if (P) registerNative({ name: 'android-mediastore', available: () => true,
      scan: async onProgress => { const r = await P.scan(); const out = (r && r.items) || []; onProgress && onProgress(out.length); return out; } });
  } catch (e) { /* not inside the app shell */ }

  const caps = () => ({
    native: !!(native && native.available && native.available()),
    folderPicker: typeof window.showDirectoryPicker === 'function',
    folderInput: 'webkitdirectory' in document.createElement('input'),
  });

  async function* walk(dir, path, depth) {
    if (depth > 8) return;
    for await (const [name, h] of dir.entries()) {
      if (h.kind === 'directory') { if (!SKIP.test(name)) yield* walk(h, [...path, name], depth + 1); }
      else if (h.kind === 'file' && isMedia(name)) yield { h, path };
    }
  }
  // Recursively finds every video / audio file under a folder handle. onProgress(n) is called as files are found.
  async function scanHandle(root, onProgress) {
    const out = [];
    for await (const { h, path } of walk(root, [], 0)) {
      try { const file = await h.getFile(); out.push({ file, folder: path.length ? path[path.length - 1] : root.name, rel: [...path, h.name].join('/') }); }
      catch (e) { continue; }
      if (onProgress) onProgress(out.length);
    }
    return out;
  }
  const pickFolder = () => window.showDirectoryPicker({ id: 'vlcpro-media', mode: 'read', startIn: 'videos' });
  // Files from <input webkitdirectory>: folder = the file's parent folder name
  function fromFolderInput(list) {
    return [...list].filter(f => isMedia(f.name, f.type)).map(f => {
      const rel = f.webkitRelativePath || f.name, parts = rel.split('/');
      return { file: f, folder: parts.length > 1 ? parts[parts.length - 2] : '', rel };
    });
  }
  async function permission(h, ask) {
    if (!h || !h.queryPermission) return 'granted';
    let p = await h.queryPermission({ mode: 'read' });
    if (p !== 'granted' && ask && h.requestPermission) p = await h.requestPermission({ mode: 'read' });
    return p;
  }
  // Re-open a file inside a saved folder (used to play after a reload — no copy of big videos is stored)
  async function fileAt(root, rel) {
    const parts = rel.split('/'); let d = root;
    for (const p of parts.slice(0, -1)) d = await d.getDirectoryHandle(p);
    return (await d.getFileHandle(parts[parts.length - 1])).getFile();
  }
  // Run async jobs with a small concurrency cap (2 = smooth thumbnails on phones)
  async function pool(items, n, fn) {
    let i = 0; const run = async () => { while (i < items.length) { const k = i++; await fn(items[k], k); } };
    await Promise.all(Array.from({ length: Math.min(n, items.length) }, run));
  }
  return { kind, isMedia, fkey, caps, pickFolder, scanHandle, fromFolderInput, permission, fileAt, pool, registerNative, get native() { return native; } };
})();
