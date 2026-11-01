// Static checks: node --test test/site.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const site = new URL('../', import.meta.url);
const read = f => readFileSync(new URL(f, site), 'utf8');
test('files exist and are linked', () => {
  for (const f of ['index.html', 'style.css', 'app.js', 'sources.js', 'theme.js', 'manifest.webmanifest', 'icon.svg']) assert.ok(existsSync(new URL(f, site)), f);
  const html = read('index.html');
  assert.match(html, /<link rel="stylesheet" href="style.css">/);
  assert.match(html, /<script src="app.js"><\/script>/);
  assert.match(html, /name="viewport" content="width=device-width/);
  assert.match(html, /<title>[^<]{5,}<\/title>/);
});
test('core UI from the VLC screenshot is present', () => {
  const html = read('index.html'), js = read('app.js');
  for (const id of ['toolbar', 'tabs', 'content', 'fab', 'bottomnav', 'player', 'fileVideo', 'fileAudio', 'fileSub']) assert.match(html, new RegExp(`id="${id}"`), id);
  for (const label of ['Video', 'Audio', 'Browse', 'Playlists', 'More']) assert.ok(html.includes(`>${label}<`), label);
  assert.ok(js.includes("'Videos', 'Playlists'"));
  assert.ok(html.includes('accept="video/*'));
});
test('features are wired', () => {
  const js = read('app.js');
  for (const s of ['createMediaElementSource', 'BiquadFilter', 'requestPictureInPicture', 'srtToVtt', 'indexedDB', 'toBlob', 'playbackRate', 'mediaSession', 'setSleep', 'abStep', 'pointermove', 'keydown'])
    assert.ok(js.includes(s), s);
});
test('privacy: no network calls, no remote assets', () => {
  const all = read('index.html') + read('style.css') + read('app.js') + read('sources.js') + read('theme.js');
  assert.ok(!/fetch\(|XMLHttpRequest|sendBeacon|WebSocket/.test(all), 'no network APIs');
  assert.ok(!/(src|href)="https?:/.test(all), 'no remote src/href');
  assert.ok(read('index.html').includes('not affiliated with VideoLAN'));
});
test('no placeholders left', () => {
  const all = read('index.html') + read('app.js');
  assert.ok(!/TODO|FIXME|[Ll]orem ipsum/.test(all));
});
test('named VLC Pro everywhere visible', () => {
  const html = read('index.html'), js = read('app.js'), man = JSON.parse(read('manifest.webmanifest'));
  assert.match(html, /<title>VLC Pro/); assert.ok(html.includes('id="tbTitle">VLC Pro<'));
  assert.equal(man.short_name, 'VLC Pro'); assert.ok(js.includes("setToolbar('VLC Pro')"));
  assert.ok(!/VLC Clone/.test(html + js + read('README.md')), 'old name gone');
});
test('no IDOR: only harmless display params are read from the URL', () => {
  const js = read('app.js') + read('sources.js') + read('theme.js');
  const keys = [...js.matchAll(/params\.(?:get|has|delete)\('([^']+)'\)/g)].map(m => m[1]);
  for (const k of keys) assert.ok(['style', 'theme', 'accent', 'nav', 'shot', 'nomotion'].includes(k), 'unexpected URL param ' + k);
  assert.ok(!/location\.(hash|pathname)/.test(js), 'no ids read from hash/path');
});
test('liquid motion + folder access are wired', () => {
  const js = read('app.js'), css = read('style.css'), src = read('sources.js');
  for (const s of ['prefers-reduced-motion', 'navBlob', 'tab-ind', 'touchstart', 'content-ghost']) assert.ok((js + css + read('index.html')).includes(s), s);
  for (const s of ['showDirectoryPicker', 'webkitdirectory', 'queryPermission', 'requestPermission', 'registerNative', 'fkey']) assert.ok((src + read('index.html')).includes(s), s);
});
test('theme & colour: 10 whitelisted accents, applied before first paint', () => {
  const html = read('index.html'), th = read('theme.js'), css = read('style.css'), js = read('app.js');
  assert.ok(html.indexOf('<script src="theme.js"></script>') > 0 && html.indexOf('<script src="theme.js"></script>') < html.indexOf('style.css'), 'theme.js runs in <head> before CSS');
  const hexes = [...th.matchAll(/id: '([a-z]+)',\s*name: '[^']+',\s*hex: '(#[0-9a-f]{6})'/g)];
  assert.equal(hexes.length, 10, '10 colours'); assert.equal(new Set(hexes.map(h => h[2])).size, 10, 'all different');
  assert.ok(th.includes("pick(MODES, p('theme')") && th.includes("ACCENTS.some(function (a) { return a.id === p('accent'); })"), 'URL values whitelisted');
  for (const s of ['@property --acc', '--acc-btn', '--acc-ink', '--on-acc']) assert.ok(css.includes(s), s);
  assert.ok(!/rgba\(255,1[0-9]{2},[0-9]+,/.test(css.replace(/rgba\(255,255,255/g, '')), 'no hard-coded orange tints left');
  for (const s of ["'Theme & Colour'", 'data-accent', "['auto', 'Auto']"]) assert.ok(js.includes(s), s);
});
test('all app text is English (Noor, Nov 1: "Text english main … All")', () => {
  const ui = read('index.html') + read('app.js') + read('sources.js') + read('theme.js') + read('manifest.webmanifest');
  const hinglish = /\b(chuno|mile|mili|saare|nahi|nahin|karo|karein|dabao|kholo|khud|sirf|hai|mein|karke|jayenge|jayega|turant|karega|poora|raha|dekhne|liye|wala|aapke|kuch|baar|phir|yahan|dobara|wapas|chalao|hoga|hota)\b/i;
  const m = ui.match(hinglish); assert.ok(!m, 'Hinglish word in UI: ' + (m && m[0]));
});
test('landscape: fullscreen + orientation lock + CSS fallback wired', () => {
  const js = read('app.js'), css = read('style.css');
  for (const s of ["o.lock(land ? 'landscape' : 'portrait')", 'webkitRequestFullscreen', 'orientationchange', 'autoRotate', 'vidLand']) assert.ok(js.includes(s), s);
  assert.ok(/#player\.rot\{[^}]*rotate\(90deg\)/.test(css), 'whole player rotates in the fallback');
});
