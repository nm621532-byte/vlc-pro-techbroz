// Copies the VLC Pro web app (the repo root: index.html, app.js, sources.js, native.js, style.css, ...) into www/
// so Capacitor can package it into the APK. Run: npm run copy-web
import { cpSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const webRoot = join(here, '..', '..');          // repo root = the web app
const out = join(here, '..', 'www');
rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });
for (const f of ['index.html', 'app.js', 'sources.js', 'native.js', 'style.css', 'manifest.webmanifest', 'icon.svg', 'theme.js']) {
  if (existsSync(join(webRoot, f))) cpSync(join(webRoot, f), join(out, f));
  else console.warn('missing', f);
}
console.log('web files copied to', out);
