#!/usr/bin/env python3
"""Theme & Colour smoke test for VLC Pro (run in BOTH styles before every publish):
   python3 -m http.server 8765 --directory . &   then   python3 test/theme_test.py http://127.0.0.1:8765/ glass|classic
Checks: each of the 10 colours applies + persists across reload (before first paint), Dark/Light/Auto,
contrast of text-on-colour and colour-on-background, URL whitelist (no IDOR), ⋮ menu entry, smooth glide, no console errors."""
import asyncio, sys, json
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8765/'
STYLE = sys.argv[2] if len(sys.argv) > 2 else 'glass'
COLOURS = {'orange': '#ff8800', 'red': '#ef4444', 'pink': '#ec4899', 'purple': '#a855f7', 'indigo': '#5b6cff',
           'sky': '#0ea5e9', 'teal': '#14b8a6', 'green': '#22c55e', 'amber': '#fbbf24', 'rosegold': '#b76e79'}
results = []
def check(name, ok, info=''):
    results.append((name, bool(ok), info)); print(('PASS ' if ok else 'FAIL ') + name + (f'  [{info}]' if info else ''), flush=True)

def to_rgb(s):
    s = s.strip()
    if s.startswith('#'): return tuple(int(s[i:i + 2], 16) for i in (1, 3, 5))
    if s.startswith('rgb'): return tuple(round(float(x)) for x in s[s.index('(') + 1:s.index(')')].split(',')[:3])
    if s.startswith('color(srgb'):
        return tuple(round(float(x) * 255) for x in s[s.index('srgb') + 4:s.index(')')].split()[:3])
    raise ValueError(s)
def lum(c):
    v = [x / 255 for x in c]; v = [x / 12.92 if x <= 0.03928 else ((x + 0.055) / 1.055) ** 2.4 for x in v]
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]
def cr(a, b):
    x, y = lum(to_rgb(a)), lum(to_rgb(b)); return (max(x, y) + 0.05) / (min(x, y) + 0.05)
def close(a, b, tol=2): return all(abs(p - q) <= tol for p, q in zip(to_rgb(a), to_rgb(b)))

FIRST = """(() => { requestAnimationFrame(() => { const cs = getComputedStyle(document.documentElement);
  window.__first = { accent: document.documentElement.dataset.accent, acc: cs.getPropertyValue('--acc').trim(), theme: document.documentElement.dataset.theme }; }); })()"""
VARS = "(() => { const cs = getComputedStyle(document.documentElement); return { acc: cs.getPropertyValue('--acc').trim(), btn: cs.getPropertyValue('--acc-btn').trim(), on: cs.getPropertyValue('--on-acc').trim(), ink: cs.getPropertyValue('--acc-ink').trim(), accent: document.documentElement.dataset.accent, theme: document.documentElement.dataset.theme, mode: document.documentElement.dataset.themeMode, meta: document.querySelector('meta[name=theme-color]').content } })()"

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 412, 'height': 892}, is_mobile=True, has_touch=True, color_scheme='dark')
        await ctx.add_init_script(FIRST)
        pg = await ctx.new_page(); errors = []
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
        ev = pg.evaluate
        await pg.goto(URL + '?style=' + STYLE); await pg.wait_for_timeout(300)
        await ev("localStorage.clear()"); await pg.goto(URL); await ev(f"VLC.SET.style='{STYLE}'; localStorage.setItem('vlc-settings', JSON.stringify(VLC.SET))")
        await pg.reload(); await pg.wait_for_timeout(500)
        v = await ev(VARS)
        check('default colour is VLC Orange', v['accent'] == 'orange' and close(v['acc'], '#ff8800'), v['acc'])
        check('style kept: ' + STYLE, await ev('document.documentElement.dataset.style') == STYLE)
        # open from More → Theme & Colour
        await pg.click('#bottomnav [data-nav=more]'); await pg.wait_for_timeout(600)
        check('More shows "Theme & Colour" row', await pg.locator('[data-act=theme-screen]').count() == 1)
        await pg.click('[data-act=theme-screen]'); await pg.wait_for_timeout(600)
        check('Theme & Colour screen opens', (await pg.inner_text('#tbTitle')).strip() == 'Theme & Colour')
        check('screen has 10 colour swatches', await pg.locator('.sw[data-accent]').count() == 10)
        check('screen has Dark/Light/Auto', await pg.locator('[data-set=theme][data-val=auto]').count() == 1 and await pg.locator('[data-set=theme][data-val=light]').count() == 1)
        check('screen has Liquid Glass/Classic', await pg.locator('[data-set=style][data-val=glass]').count() == 1 and await pg.locator('[data-set=style][data-val=classic]').count() == 1)
        # smooth glide: sample mid-transition
        await pg.click('.sw[data-accent=indigo]'); await pg.wait_for_timeout(140)
        mid = (await ev(VARS))['acc']
        check('colour glides smoothly (mid-transition value between old and new)', not close(mid, '#ff8800', 6) and not close(mid, '#5b6cff', 6), mid)
        await pg.wait_for_timeout(600)
        metas = set()
        for theme in ('dark', 'light'):
            await pg.click(f'[data-set=theme][data-val={theme}]'); await pg.wait_for_timeout(600)
            for cid, hx in COLOURS.items():
                await pg.click(f'.sw[data-accent={cid}]'); await pg.wait_for_timeout(560)
                v = await ev(VARS)
                prev = await ev("(() => { const s = q => getComputedStyle(document.querySelector(q)); return { fab: s('.th-prev .pv-fab').backgroundColor, seek: s('.th-prev .pv-seek i').backgroundColor, btn: s('.th-prev .pv-btn').backgroundColor, btnTxt: s('.th-prev .pv-btn').color, h: s('.section-h').color } })()")
                saved = json.loads(await ev("localStorage.getItem('vlc-settings')"))
                ok = v['accent'] == cid and close(v['acc'], hx) and close(prev['fab'], hx) and close(prev['seek'], hx) and saved.get('accent') == cid
                check(f'{theme}: {cid} applies everywhere + saved', ok, f"{v['acc']} fab {prev['fab']}")
                c1 = cr(v['on'], v['btn']); c2 = cr(v['ink'], '#ffffff' if theme == 'light' else '#2a2a2a'); c3 = cr(prev['btnTxt'], prev['btn'])
                check(f'{theme}: {cid} contrast (text on colour ≥3, colour text on page ≥4.5)', c1 >= 3 and c2 >= 4.5 and c3 >= 3, f'{c1:.2f} / {c2:.2f}')
                check(f'{theme}: {cid} sheet swatch selected', await ev(f"document.querySelector('.sw[data-accent={cid}]').classList.contains('on') && document.querySelectorAll('.sw.on').length === 1"))
                metas.add(v['meta'])
        check('PWA theme-color meta follows colour + theme', len(metas) >= 18, f'{len(metas)} distinct')
        # persist across reload for every colour, applied before first paint
        for theme in ('dark', 'light'):
            for cid, hx in COLOURS.items():
                await ev(f"(() => {{ const s = JSON.parse(localStorage.getItem('vlc-settings')); s.accent = '{cid}'; s.theme = '{theme}'; localStorage.setItem('vlc-settings', JSON.stringify(s)); }})()")
                await pg.reload(); await pg.wait_for_timeout(250)
                f = await ev('window.__first')
                check(f'reload: {theme} {cid} kept, already set at first frame (no flash)', f and f['accent'] == cid and f['theme'] == theme and close(f['acc'], hx), json.dumps(f))
        # main UI uses the colour
        await pg.goto(URL); await pg.wait_for_timeout(400)
        await ev("VLC.setAccent('teal')"); await pg.wait_for_timeout(600)
        ui = await ev("(() => { const s = q => getComputedStyle(document.querySelector(q)); return { fab: s('#fab').backgroundImage + ' ' + s('#fab').backgroundColor, nav: s('#bottomnav button.active .nl').color, ink: getComputedStyle(document.documentElement).getPropertyValue('--acc-ink').trim(), ind: s('.tab-ind').backgroundImage + ' ' + s('.tab-ind').backgroundColor } })()")
        check('library: FAB uses the colour', '20, 184, 166' in ui['fab'] or 'color(srgb' in ui['fab'] or 'rgb(18, 166, 149)' in ui['fab'], ui['fab'][:120])
        check('library: active bottom-nav item uses the colour', close(ui['nav'], ui['ink']), ui['nav'])
        check('library: tab indicator uses the colour', ('20, 184, 166' in ui['ind']) or ('18, 166, 149' in ui['ind']) or 'color(srgb' in ui['ind'], ui['ind'][:120])
        # ⋮ menu entry
        await pg.click('#btnMenu'); await pg.wait_for_timeout(500)
        await pg.locator('#sheet [data-a=theme], #sheet :text("Theme & Colour")').first.click(); await pg.wait_for_timeout(700)
        check('⋮ menu → Theme & Colour opens the screen', (await pg.inner_text('#tbTitle')).strip() == 'Theme & Colour' and await pg.locator('.sw').count() == 10)
        # Auto mode follows the phone live
        await pg.click('[data-set=theme][data-val=auto]'); await pg.wait_for_timeout(500)
        await pg.emulate_media(color_scheme='light'); await pg.wait_for_timeout(500)
        a1 = await ev(VARS)
        await pg.emulate_media(color_scheme='dark'); await pg.wait_for_timeout(500)
        a2 = await ev(VARS)
        check('Auto: phone light → app light, phone dark → app dark (live)', a1['theme'] == 'light' and a2['theme'] == 'dark' and a1['mode'] == 'auto', f"{a1['theme']}/{a2['theme']}")
        await pg.emulate_media(color_scheme='light'); await pg.reload(); await pg.wait_for_timeout(300)
        f = await ev('window.__first')
        check('Auto kept after reload (light phone → light at first frame)', f['theme'] == 'light' and json.loads(await ev("localStorage.getItem('vlc-settings')"))['theme'] == 'auto')
        await pg.emulate_media(color_scheme='dark')
        # Dark / Light persist
        await pg.goto(URL); await ev("VLC.openTheme()"); await pg.wait_for_timeout(500)
        await pg.click('[data-set=theme][data-val=light]'); await pg.wait_for_timeout(500); await pg.reload(); await pg.wait_for_timeout(300)
        check('Light kept after reload', (await ev('window.__first'))['theme'] == 'light')
        await ev("VLC.openTheme()"); await pg.wait_for_timeout(500)
        await pg.click('[data-set=theme][data-val=dark]'); await pg.wait_for_timeout(500); await pg.reload(); await pg.wait_for_timeout(300)
        check('Dark kept after reload', (await ev('window.__first'))['theme'] == 'dark')
        # URL: only the 10 whitelisted values, never saved
        await ev("VLC.setAccent('green')"); await pg.wait_for_timeout(300)
        await pg.goto(URL + '?accent=purple'); await pg.wait_for_timeout(400)
        v = await ev(VARS)
        check('?accent=purple (whitelisted) shows purple', v['accent'] == 'purple' and close(v['acc'], '#a855f7'))
        check('URL accent is not saved to the phone', json.loads(await ev("localStorage.getItem('vlc-settings')"))['accent'] == 'green')
        await pg.goto(URL + '?accent=%23000%22%3E%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E&theme=hacker&style=evil'); await pg.wait_for_timeout(400)
        v = await ev(VARS)
        check('unknown ?accent/?theme/?style values ignored', v['accent'] == 'green' and v['theme'] in ('dark', 'light') and await ev('document.documentElement.dataset.style') in ('glass', 'classic') and close(v['acc'], '#22c55e'))
        check('no injected markup from URL', await ev("document.querySelectorAll('img[src=x]').length") == 0)
        await pg.goto(URL + '?accent=orange&id=5&user=2'); await pg.wait_for_timeout(300)
        check('other URL params change nothing', (await ev(VARS))['accent'] == 'orange' and json.loads(await ev("localStorage.getItem('vlc-settings')"))['accent'] == 'green')
        # reduced motion: no glide
        rm = await b.new_context(viewport={'width': 412, 'height': 892}, reduced_motion='reduce')
        p2 = await rm.new_page(); await p2.goto(URL + '?style=' + STYLE); await p2.wait_for_timeout(300)
        await p2.evaluate("VLC.openTheme()"); await p2.wait_for_timeout(400)
        await p2.click('.sw[data-accent=red]'); await p2.wait_for_timeout(60)
        check('reduced motion: colour switches instantly', close((await p2.evaluate(VARS))['acc'], '#ef4444'))
        await rm.close()
        # data stays on device
        check('no console errors', not errors, '; '.join(errors)[:300])
        await ev("localStorage.clear()")
        await b.close()
    n = sum(1 for r in results if r[1]); print(f'\nTHEME {STYLE}: {n}/{len(results)} passed')
    sys.exit(0 if n == len(results) else 1)
asyncio.run(main())
