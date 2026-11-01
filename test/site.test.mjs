// Static checks: node --test test/site.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const site = new URL('../', import.meta.url);
const read = f => readFileSync(new URL(f, site), 'utf8');
test('files exist and are linked', () => {
  for (const f of ['index.html', 'style.css', 'app.js']) assert.ok(existsSync(new URL(f, site)), f);
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
  const all = read('index.html') + read('style.css') + read('app.js');
  assert.ok(!/fetch\(|XMLHttpRequest|sendBeacon|WebSocket/.test(all), 'no network APIs');
  assert.ok(!/(src|href)="https?:/.test(all), 'no remote src/href');
  assert.ok(read('index.html').includes('not affiliated with VideoLAN'));
});
test('no placeholders left', () => {
  const all = read('index.html') + read('app.js');
  assert.ok(!/TODO|FIXME|[Ll]orem ipsum/.test(all));
});
