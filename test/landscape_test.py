#!/usr/bin/env python3
"""Landscape / rotation smoke test for VLC Pro (Noor, Nov 1: "Landscape nhi hota hai").
   python3 test/landscape_test.py http://127.0.0.1:8765/ <folder with 'Wide Clip 720p.mp4' + 'Vertical Reel 480p.mp4'> glass|classic
screen.orientation.lock is mocked (headless Chrome has no real screen to turn): mode "ok" = Android Chrome, mode "fail" = iPhone Safari (no lock)."""
import asyncio, sys
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8765/'
MEDIA = sys.argv[2] if len(sys.argv) > 2 else 'testmedia'
STYLE = sys.argv[3] if len(sys.argv) > 3 else 'glass'
results = []
def check(name, ok, info=''):
    results.append((name, bool(ok), info)); print(('PASS ' if ok else 'FAIL ') + name + (f'  [{info}]' if info else ''), flush=True)
MOCK = """(() => { window.__or = { calls: [], mode: 'ok', type: null };
  const P = ScreenOrientation.prototype, T = Object.getOwnPropertyDescriptor(P, 'type');
  Object.defineProperty(P, 'lock', { configurable: true, value(o) { __or.calls.push(o); if (__or.mode === 'fail') return Promise.reject(new DOMException('not supported', 'NotSupportedError'));
    __or.type = o === 'landscape' ? 'landscape-primary' : 'portrait-primary'; return Promise.resolve(); } });
  Object.defineProperty(P, 'unlock', { configurable: true, value() { __or.calls.push('unlock'); __or.type = null; } });
  Object.defineProperty(P, 'type', { configurable: true, get() { return __or.type || T.get.call(this); } }); })()"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
        errors = []
        async def page(w, h, mode='ok'):
            ctx = await b.new_context(viewport={'width': w, 'height': h}, is_mobile=True, has_touch=True)
            await ctx.add_init_script(MOCK)
            pg = await ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e))); pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
            await pg.goto(URL + '?style=' + STYLE); await pg.wait_for_timeout(300)
            await pg.evaluate(f"__or.mode = '{mode}'")
            await pg.set_input_files('#fileVideo', [MEDIA + '/Wide Clip 720p.mp4', MEDIA + '/Vertical Reel 480p.mp4'])
            for _ in range(60):
                if await pg.evaluate('VLC.S.media.length') >= 2: break
                await pg.wait_for_timeout(250)
            await pg.evaluate("document.getElementById('toast').classList.add('hidden')")
            return ctx, pg
        async def open_row(pg, name):
            await pg.locator('.row[data-kind=media]', has_text=name).first.click(); await pg.wait_for_timeout(1200)
        calls = lambda pg: pg.evaluate('__or.calls.slice()')
        fs = lambda pg: pg.evaluate('!!document.fullscreenElement')
        # ---------- A: Android-like (lock works) ----------
        ctx, pg = await page(412, 892, 'ok')
        await open_row(pg, 'Wide Clip')
        check('auto: wide video opens in landscape (fullscreen + lock landscape)', 'landscape' in await calls(pg) and await fs(pg), str(await calls(pg)))
        await pg.evaluate('__or.calls = []'); await pg.click('#pRotate', force=True); await pg.wait_for_timeout(300)
        check('rotate button → portrait', (await calls(pg))[-1:] == ['portrait'], str(await calls(pg)))
        await pg.click('#pRotate', force=True); await pg.wait_for_timeout(300)
        check('rotate button again → landscape', (await calls(pg))[-1:] == ['landscape'])
        await pg.click('#pFull', force=True); await pg.wait_for_timeout(400)
        check('fullscreen button exits fullscreen + unlocks', not await fs(pg) and 'unlock' in await calls(pg))
        await pg.evaluate('__or.calls = []'); await pg.click('#pFull', force=True); await pg.wait_for_timeout(400)
        check('fullscreen button: wide video → fullscreen + landscape', await fs(pg) and (await calls(pg))[-1:] == ['landscape'], str(await calls(pg)))
        await pg.evaluate("document.getElementById('pv').pause()")
        box = await pg.locator('#gest').bounding_box(); cx, cy = box['x'] + box['width'] / 2, box['y'] + box['height'] * 0.3
        await pg.evaluate('__or.calls = []'); await pg.mouse.click(cx, cy); await pg.wait_for_timeout(120); await pg.mouse.click(cx, cy); await pg.wait_for_timeout(400)
        check('double-tap middle toggles landscape ↔ portrait', (await calls(pg))[-1:] == ['portrait'], str(await calls(pg)))
        await pg.click('#pBack', force=True); await pg.wait_for_timeout(500)
        check('closing the player leaves fullscreen + unlocks', not await fs(pg) and 'unlock' in await calls(pg))
        await pg.evaluate('__or.calls = []'); await open_row(pg, 'Vertical Reel')
        check('vertical video is not forced sideways', 'landscape' not in await calls(pg), str(await calls(pg)))
        await pg.click('#pFull', force=True); await pg.wait_for_timeout(400)
        check('fullscreen button: vertical video → portrait', (await calls(pg))[-1:] == ['portrait'] and await fs(pg))
        await pg.click('#pBack', force=True); await pg.wait_for_timeout(400)
        await pg.click('#bottomnav [data-nav=more]'); await pg.wait_for_timeout(500); await pg.click('[data-set=autoRotate][data-val=false]')
        await pg.click('#bottomnav [data-nav=video]'); await pg.wait_for_timeout(500)
        await pg.evaluate('__or.calls = []'); await open_row(pg, 'Wide Clip')
        check('Auto landscape OFF setting respected', await calls(pg) == [] and not await fs(pg), str(await calls(pg)))
        await ctx.close()
        # ---------- B: iPhone-like (no lock) → CSS rotation fallback ----------
        ctx, pg = await page(412, 892, 'fail')
        await open_row(pg, 'Wide Clip')
        check('no lock: auto does not leave a half state', not await fs(pg) and not await pg.evaluate("player.classList.contains('rot')"))
        await pg.click('#pRotate', force=True); await pg.wait_for_timeout(500)
        rot = await pg.evaluate("(() => { const r = document.getElementById('player').getBoundingClientRect(); const b = document.querySelector('.p-bottom').getBoundingClientRect(); return { rot: player.classList.contains('rot'), w: r.width, h: r.height, x: r.x, y: r.y, bl: b.left, bt: b.top, bb: b.bottom, br: b.right, tf: getComputedStyle(player).transform } })()")
        check('no lock: Rotate turns the whole player 90° (CSS fallback)', rot['rot'] and 'matrix(0, 1, -1, 0' in rot['tf'].replace('6.12323e-17', '0').replace('-6.12323e-17', '0') or (rot['rot'] and abs(rot['w'] - 412) < 2), rot['tf'])
        check('no lock: rotated player fills the screen', abs(rot['w'] - 412) < 2 and abs(rot['h'] - 892) < 2 and abs(rot['x']) < 2 and abs(rot['y']) < 2, f"{rot['w']:.0f}x{rot['h']:.0f}")
        check('no lock: controls bar is on screen (along the long edge)', rot['bl'] >= -1 and rot['br'] <= 413 and rot['bt'] >= -1 and rot['bb'] <= 893 and (rot['bb'] - rot['bt']) > 300, str(rot))
        await pg.evaluate("document.getElementById('pv').pause(); document.getElementById('pv').currentTime = 1")
        await pg.mouse.click(132, 780); await pg.wait_for_timeout(120); await pg.mouse.click(132, 780); await pg.wait_for_timeout(400)
        t = await pg.evaluate("document.getElementById('pv').currentTime")
        check('no lock: double-tap uses the rotated sides (+10 s)', t >= 10.5 or t >= await pg.evaluate("document.getElementById('pv').duration") - 0.6, f'{t:.1f}')
        await pg.click('#pRotate', force=True); await pg.wait_for_timeout(400)
        check('no lock: Rotate again → back to portrait', not await pg.evaluate("player.classList.contains('rot')"))
        await pg.click('#pFull', force=True); await pg.wait_for_timeout(400)
        check('no lock: Fullscreen on a wide video → sideways', await pg.evaluate("player.classList.contains('rot')"))
        await pg.set_viewport_size({'width': 892, 'height': 412}); await pg.wait_for_timeout(500)
        check('turning the phone for real removes the CSS rotation', not await pg.evaluate("player.classList.contains('rot')"))
        await ctx.close()
        # ---------- C: landscape layout ----------
        ctx, pg = await page(915, 412, 'ok')
        await pg.evaluate("VLC.SET.autoRotate = false")
        await open_row(pg, 'Wide Clip'); await pg.evaluate("document.getElementById('pv').pause()")
        g = await pg.evaluate("(() => { const r = s => document.querySelector(s).getBoundingClientRect(); const v = r('#pv'), t = r('.p-top'), m = r('.p-mid'), bt = r('.p-bottom'); return { vw: v.width, vh: v.height, tt: t.top, tb: t.bottom, mt: m.top, mb: m.bottom, bt: bt.top, bb: bt.bottom, bw: bt.width } })()")
        check('landscape: video fills the screen', g['vw'] >= 913 and g['vh'] >= 410, f"{g['vw']:.0f}x{g['vh']:.0f}")
        check('landscape: top bar at top, controls along the bottom', g['tt'] <= 20 and g['bb'] <= 412 and g['bb'] >= 390 and g['bw'] >= 850, str(g))
        check('landscape: middle buttons do not overlap the bars', g['mt'] >= g['tb'] - 1 and g['mb'] <= g['bt'] + 1, str(g))
        await ctx.close()
        check('no console errors', not errors, '; '.join(errors)[:300])
        await b.close()
    n = sum(1 for r in results if r[1]); print(f'\nLANDSCAPE {STYLE}: {n}/{len(results)} passed')
    sys.exit(0 if n == len(results) else 1)
asyncio.run(main())
