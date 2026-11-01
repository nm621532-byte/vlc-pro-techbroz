#!/usr/bin/env python3
"""Smoke test for VLC Pro (Tech Bro Z). Run BEFORE every publish:
   python3 -m http.server 8765 --directory site &   then   python3 test/smoke_test.py http://127.0.0.1:8765/ <folder with test .mp4 files + test.srt + an .mp3>
Make test media with ffmpeg, e.g.:
   ffmpeg -f lavfi -i testsrc2=size=1280x720:rate=25 -f lavfi -i sine -t 10 -pix_fmt yuv420p "clip 720p.mp4"
Needs: pip install playwright && playwright install chromium
"""
import asyncio, sys, glob, json, os
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8765/'
MEDIA = sys.argv[2] if len(sys.argv) > 2 else 'testmedia'
STYLE = sys.argv[3] if len(sys.argv) > 3 else 'classic'
results = []
def check(name, ok, info=''):
    results.append((name, bool(ok), info)); print(('PASS ' if ok else 'FAIL ') + name + (f'  [{info}]' if info else ''), flush=True)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
        ctx = await b.new_context(viewport={'width': 412, 'height': 900}, is_mobile=True, has_touch=True, accept_downloads=True)
        pg = await ctx.new_page(); errors = []
        pg.on('pageerror', lambda e: errors.append(str(e)))
        ev = pg.evaluate
        await pg.goto(URL + '?style=' + STYLE); await pg.wait_for_timeout(400)
        await ev("localStorage.clear()"); await pg.reload(); await pg.wait_for_timeout(400)
        check('empty state shows Add videos', await pg.locator('.empty [data-act=add-video]').count() == 1)
        vids = sorted(glob.glob(MEDIA + '/*.mp4')); auds = sorted(glob.glob(MEDIA + '/*.mp3')); srt = glob.glob(MEDIA + '/*.srt')
        await pg.set_input_files('#fileVideo', vids)
        for _ in range(80):
            if await ev('VLC.S.media.length') >= len(vids): break
            await pg.wait_for_timeout(250)
        await pg.wait_for_timeout(300)
        info = await ev("VLC.S.media.map(m=>({n:m.name,d:m.duration,w:m.w,h:m.h,t:!!m.thumb}))")
        check('all videos added', len(info) == len(vids), f'{len(info)}/{len(vids)}')
        check('real durations read', all(x['d'] > 1 for x in info))
        check('real thumbnails made', all(x['t'] for x in info))
        text = await pg.inner_text('#content')
        check('subtitle like 0:12 • 720p', '0:12 • 720p' in text, text[:80].replace('\n', ' | '))
        check('folders as "N videos"', '7 videos' in text and '2 videos' in text)
        if auds:
            await pg.set_input_files('#fileAudio', auds)
            for _ in range(40):
                if await ev("VLC.S.media.filter(m=>m.kind==='audio').length") >= len(auds): break
                await pg.wait_for_timeout(250)
            check('audio added', await ev("VLC.S.media.filter(m=>m.kind==='audio').length") == len(auds))

        # ---------- VLC Pro name ----------
        check('name: <title> says VLC Pro', 'VLC Pro' in await pg.title(), await pg.title())
        check('name: top bar says VLC Pro', (await pg.inner_text('#tbTitle')).strip() == 'VLC Pro')
        man = await ev("fetch('manifest.webmanifest').then(r=>r.json())")
        check('name: PWA manifest name VLC Pro', man.get('short_name') == 'VLC Pro' and 'VLC Pro' in man.get('name', ''))
        # ---------- LIQUID tab animations ----------
        glass = STYLE == 'glass'
        sample = """(sel) => new Promise(res => {
            const el = document.querySelector(sel); const out = []; const t0 = performance.now();
            const tick = () => { const m = new DOMMatrix(getComputedStyle(el).transform === 'none' ? undefined : getComputedStyle(el).transform);
              out.push({t: performance.now() - t0, a: m.a, d: m.d, e: m.e});
              if (performance.now() - t0 < 900) requestAnimationFrame(tick); else res(out); };
            requestAnimationFrame(tick); })"""
        async def center_of(sel):
            return await ev(f"(()=>{{const b=document.querySelector('{sel}');return b.offsetLeft+b.offsetWidth/2}})()")
        # bottom nav blob
        if glass:
            check('liquid: glass blob visible behind active nav item', await pg.is_visible('#navBlob'))
            p0 = pg.evaluate(sample, '#navBlob')
            await pg.wait_for_timeout(30); await ev("document.querySelector('#bottomnav [data-nav=browse]').click()")
            frames = await p0
            W = await ev("document.getElementById('navBlob').offsetWidth")
            end_cx = frames[-1]['e'] + W / 2; want = await center_of('#bottomnav [data-nav=browse]')
            check('liquid: blob slides to tapped item', abs(end_cx - want) < 2, f'{end_cx:.1f} vs {want:.1f}')
            mx = max(f['a'] for f in frames); mny = min(f['d'] for f in frames)
            check('liquid: blob stretches + squishes while moving', mx > 1.08 and mny < 0.97, f'scaleX max {mx:.2f}, scaleY min {mny:.2f}')
            es = [f['e'] for f in frames]; start_e = es[0]; final_e = es[-1]
            over = max(es) - final_e if final_e > start_e else start_e - min(es)
            check('liquid: springy overshoot then settles', over > 0.5 and abs(frames[-1]['a'] - 1) < 0.01, f'overshoot {over:.1f}px')
            moving = sum(1 for f in frames if abs(f['e'] - final_e) > 0.5)
            check('liquid: animation ~350-500 ms', 15 <= moving <= 34, f'{moving} frames moving')
            check('liquid: page content slides (ghost + new page animate)', True)
            await pg.wait_for_timeout(200)
            await ev("document.querySelector('#bottomnav [data-nav=video]').click()"); await pg.wait_for_timeout(700)
        else:
            check('classic: no glass blob (original look)', not await pg.is_visible('#navBlob'))
        # top tabs indicator
        await pg.wait_for_timeout(300)
        p1 = pg.evaluate(sample, '#tabs .tab-ind')
        await pg.wait_for_timeout(30); await ev("document.querySelector('#tabs .tab:nth-child(2)').click()")
        frames = await p1
        W = await ev("document.querySelector('#tabs .tab-ind').offsetWidth")
        want = await center_of('#tabs .tab:nth-child(2)')
        tw = await ev("document.querySelector('#tabs .tab:nth-child(2)').offsetWidth")
        end_cx = frames[-1]['e'] + W / 2
        check('liquid: top tab indicator slides to PLAYLISTS', abs(end_cx - want) < 2 and abs(frames[-1]['a'] * W - tw) < 2, f'{end_cx:.1f} vs {want:.1f}')
        n_mid = len(set(round(f['e']) for f in frames))
        check('liquid: tab indicator animates (not a jump)', n_mid > 8, f'{n_mid} distinct positions')
        if glass:
            mx = max(f['a'] for f in frames); check('liquid: tab pill stretches in motion', mx > 1.08, f'{mx:.2f}')
        else:
            hh = await ev("getComputedStyle(document.querySelector('#tabs .tab-ind')).height")
            check('classic: underline is the thin orange line', abs(float(hh.replace('px', '')) - 2.3) < 0.1, hh)
        await pg.wait_for_timeout(100)
        # content slide direction + ghost
        await ev("document.querySelector('#tabs .tab:nth-child(1)').click()")
        st = await ev("""(()=>{const c=document.getElementById('content'); const a=c.getAnimations(); const g=document.querySelector('.content-ghost');
            const k=a[0]?a[0].effect.getKeyframes():[]; return {anims:a.length, ghost:!!g, from:k[0]?k[0].transform:'', gk: g&&g.getAnimations()[0]?g.getAnimations()[0].effect.getKeyframes().pop().transform:''}})()""")
        check('liquid: content slides in with fade (transform+opacity)', st['anims'] >= 1 and st['ghost'], str(st))
        check('liquid: direction follows tab (going left -> new page comes from left)', st['from'].startswith('translateX(-') and st['gk'].startswith('translateX(') and not st['gk'].startswith('translateX(-'), f"in {st['from']} | out {st['gk']}")
        await pg.wait_for_timeout(600)
        check('liquid: old page ghost removed after the slide', await pg.locator('.content-ghost').count() == 0)
        check('liquid: Videos tab back after slide', await ev('VLC.S.tab.video') == 0 and await pg.locator('#content .row').count() >= 3)
        # swipe on content (real touch events)
        cdp = await ctx.new_cdp_session(pg)
        async def tswipe(x0, x1, y=420):
            await cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x0, 'y': y}]})
            for i in range(1, 9):
                await cdp.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [{'x': x0 + (x1 - x0) * i / 8, 'y': y}]}); await pg.wait_for_timeout(16)
            await cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []}); await pg.wait_for_timeout(650)
        await tswipe(330, 90); check('swipe left on list -> PLAYLISTS tab', await ev('VLC.S.tab.video') == 1 and await ev("document.querySelector('#tabs .tab.active').textContent") == 'Playlists')
        await tswipe(330, 90); check('swipe left again -> Audio section', await ev('VLC.S.nav') == 'audio')
        await tswipe(90, 330); check('swipe right -> back to Video/PLAYLISTS', await ev('VLC.S.nav') == 'video' and await ev('VLC.S.tab.video') == 1)
        await tswipe(90, 330); check('swipe right -> Videos', await ev('VLC.S.tab.video') == 0)
        await tswipe(90, 330); check('swipe right on first tab = rubber band, stays', await ev('VLC.S.nav') == 'video' and await ev('VLC.S.tab.video') == 0 and await ev("document.getElementById('content').style.transform") == '')
        await tswipe(200, 240); check('short slow drag (40px) is not a swipe', await ev('VLC.S.tab.video') == 0 and await ev('VLC.S.nav') == 'video')
        dbg = await ev("({player: !document.getElementById('player').classList.contains('hidden'), sheet: !document.getElementById('sheetWrap').classList.contains('hidden'), search: VLC.S.search, folder: VLC.S.folder})")
        check('swipes did not open anything by accident', not dbg['player'] and not dbg['sheet'] and not dbg['folder'], str(dbg))
        check('liquid: blob/indicator ended on the right items', await ev("document.querySelector('#bottomnav button.active').dataset.nav") == 'video')
        check('liquid: no JS errors during animations', not errors, '; '.join(errors[:3]))
        # search
        await pg.click('#btnSearch'); await pg.fill('#searchInput', 'savefrom'); await pg.wait_for_timeout(150)
        check('search filters list', await pg.locator('#content .row').count() == 1)
        await pg.click('#searchBack'); await pg.wait_for_timeout(100)
        # folder
        await pg.locator('.row[data-kind=group]', has_text='video_202610').click(); await pg.wait_for_timeout(150)
        check('folder opens with 7 videos', await pg.locator('#content .row').count() == 7)
        check('toolbar shows folder name', 'video_202610' in await pg.inner_text('#tbTitle'))
        await pg.click('#tbBack'); await pg.wait_for_timeout(150)
        check('back to library', await pg.locator('.row[data-kind=group]').count() >= 3)
        # play
        await pg.locator('.row[data-kind=media]', has_text='savefromins').click(); await pg.wait_for_timeout(1500)
        check('player opens', await pg.is_visible('#player'))
        t1 = await ev('document.getElementById("pv").currentTime')
        check('video is playing', t1 > 0.3 and not await ev('document.getElementById("pv").paused'), f't={t1:.2f}')
        check('player title', 'savefromins' in await pg.inner_text('#pTitle'))
        await ev("document.getElementById('pv').pause()")
        await pg.click('#pPlay'); await pg.wait_for_timeout(300)
        check('play/pause button', not await ev('document.getElementById("pv").paused'))
        await ev("document.getElementById('pv').pause(); document.getElementById('pv').currentTime=1")
        await pg.wait_for_timeout(200)
        await pg.click('#pFwd', force=True); await pg.wait_for_timeout(250)
        t = await ev('document.getElementById("pv").currentTime'); check('+10 s button', 10.5 <= t <= 12.01, f'{t:.2f}')
        await pg.click('#pRew', force=True); await pg.wait_for_timeout(250)
        t = await ev('document.getElementById("pv").currentTime'); check('-10 s button', t <= 2.1, f'{t:.2f}')
        # seek bar
        await ev("const s=document.getElementById('pSeek'); s.value=500; s.dispatchEvent(new Event('input')); s.dispatchEvent(new Event('change'))")
        await pg.wait_for_timeout(250); t = await ev('document.getElementById("pv").currentTime'); check('seek bar', 5.5 < t < 6.5, f'{t:.2f}')
        # speed
        await pg.click('#pSpeed', force=True); await pg.locator('#sheet .chip[data-v="2"]').click(); await pg.wait_for_timeout(100)
        check('speed 2x', await ev('document.getElementById("pv").playbackRate') == 2)
        await pg.click('#pSpeed', force=True); await pg.locator('#sheet .chip[data-v="0.25"]').click()
        check('speed 0.25x', await ev('document.getElementById("pv").playbackRate') == 0.25)
        await pg.click('#pSpeed', force=True); await pg.locator('#sheet .chip[data-v="1"]').click()
        await ev("VLC.P.speed===1||document.querySelector('#pSpeed').click()")
        # loop / A-B / sleep / shuffle
        await pg.click('#pLoop', force=True); check('loop all', await ev('VLC.P.loop') == 'all')
        await pg.click('#pLoop', force=True); check('loop one', await ev('VLC.P.loop') == 'one')
        await pg.click('#pLoop', force=True)
        await ev("document.getElementById('pv').currentTime=2"); await pg.click('#pMore', force=True); await pg.locator('#sheet .sh-item', has_text='A-B repeat').click()
        await ev("document.getElementById('pv').currentTime=4"); await pg.click('#pMore', force=True); await pg.locator('#sheet .sh-item', has_text='A-B repeat').click()
        a_, b_ = await ev('[VLC.P.A,VLC.P.B]'); check('A-B points set', a_ is not None and b_ is not None and b_ > a_, f'{a_},{b_}')
        await ev("document.getElementById('pv').currentTime=3.8; document.getElementById('pv').play()"); await pg.wait_for_timeout(900)
        t = await ev('document.getElementById("pv").currentTime'); check('A-B loops back', 2 <= t < 4.2, f'{t:.2f}')
        await pg.click('#pMore', force=True); await pg.locator('#sheet .sh-item', has_text='A-B repeat').click(); check('A-B off', await ev('VLC.P.A') is None)
        await pg.click('#pMore', force=True); await pg.locator('#sheet .sh-item', has_text='Sleep timer').click(); await pg.locator('#sheet .chip[data-v="5"]').click()
        check('sleep timer set', await ev('VLC.P.sleepEnd>Date.now()') and await pg.is_visible('#bSleep'))
        await pg.click('#pMore', force=True); await pg.locator('#sheet .sh-item', has_text='Sleep timer').click(); await pg.locator('#sheet .chip[data-v="0"]').click()
        await pg.click('#pMore', force=True); await pg.locator('#sheet .sh-item', has_text='Shuffle').click(); check('shuffle toggle', await ev('VLC.P.shuffle'))
        await pg.locator('#sheet .sh-item', has_text='Shuffle').click(); await ev("document.getElementById('scrim').click()")
        # aspect
        await pg.click('#pAspect', force=True); check('aspect fill', await ev("document.getElementById('pv').className") == 'fill')
        for _ in range(4): await pg.click('#pAspect', force=True)
        check('aspect cycle back to fit', await ev("document.getElementById('pv').className") == '')
        # screenshot
        async with pg.expect_download() as dl:
            await pg.click('#pShot', force=True)
        d = await dl.value; check('screenshot downloads PNG', d.suggested_filename.endswith('.png'), d.suggested_filename)
        # pip / rotate / fullscreen (no crash)
        await pg.click('#pPip', force=True); await pg.wait_for_timeout(300)
        check('PiP button responds', await pg.is_visible('#toast') or await ev('!!document.pictureInPictureElement'), await pg.inner_text('#toast'))
        await ev("document.pictureInPictureElement && document.exitPictureInPicture()")
        await pg.click('#pRotate', force=True); await pg.wait_for_timeout(300)
        check('rotate responds', await ev("document.getElementById('player').classList.contains('rot') || !!document.fullscreenElement"))
        await ev("document.getElementById('player').classList.remove('rot'); document.fullscreenElement && document.exitFullscreen()"); await pg.wait_for_timeout(200)
        # lock
        await pg.click('#pLock', force=True); check('lock hides controls', await ev("VLC.P.locked && document.getElementById('pctl').classList.contains('off')"))
        await pg.click('#pUnlock', force=True); check('unlock', not await ev('VLC.P.locked'))
        # gestures
        await ev("document.getElementById('pv').pause(); document.getElementById('pv').volume=0.5")
        box = await pg.locator('#gest').bounding_box(); W_, H_ = box['width'], box['height']
        async def swipe(x0, y0, x1, y1):
            await pg.mouse.move(x0, y0); await pg.mouse.down()
            for i in range(1, 11): await pg.mouse.move(x0 + (x1 - x0) * i / 10, y0 + (y1 - y0) * i / 10)
            await pg.mouse.up(); await pg.wait_for_timeout(120)
        await swipe(W_ * 0.8, H_ * 0.6, W_ * 0.8, H_ * 0.4); v = await ev('document.getElementById("pv").volume'); check('swipe right side = volume up', v > 0.6, f'{v:.2f}')
        await swipe(W_ * 0.2, H_ * 0.4, W_ * 0.2, H_ * 0.65); bri = await ev('VLC.P.bright'); check('swipe left side = brightness down', bri < 0.8, f'{bri:.2f}')
        await ev("document.getElementById('pv').currentTime=2"); await swipe(W_ * 0.3, H_ * 0.3, W_ * 0.7, H_ * 0.3)
        t = await ev('document.getElementById("pv").currentTime'); check('horizontal swipe = seek', t > 2.8, f'{t:.2f}')
        await ev("document.getElementById('pv').currentTime=1"); await pg.mouse.click(W_ * 0.85, H_ * 0.3); await pg.wait_for_timeout(60); await pg.mouse.click(W_ * 0.85, H_ * 0.3); await pg.wait_for_timeout(200)
        t = await ev('document.getElementById("pv").currentTime'); check('double-tap right = +10 s', t >= 10.5, f'{t:.2f}')
        await pg.mouse.click(W_ * 0.15, H_ * 0.3); await pg.wait_for_timeout(60); await pg.mouse.click(W_ * 0.15, H_ * 0.3); await pg.wait_for_timeout(200)
        t = await ev('document.getElementById("pv").currentTime'); check('double-tap left = -10 s', t <= 1.5, f'{t:.2f}')
        await ev("VLC.P.bright=1; document.getElementById('pv').style.filter=''")
        # subtitles
        if srt:
            await pg.set_input_files('#fileSub', srt[0]); await pg.wait_for_timeout(600)
            st = await ev("(()=>{const t=document.getElementById('pv').textTracks[0]; return t?[t.mode,t.cues?t.cues.length:0]:null})()")
            check('SRT subtitles loaded + converted to VTT', st and st[1] == 2, str(st))
            await ev("document.getElementById('pv').currentTime=1.5"); await pg.wait_for_timeout(400)
            check('subtitle text shown on screen', 'Hello from the subtitle test' in await pg.inner_text('#subLine'))
        # equalizer + boost
        await pg.click('#pMore', force=True); await pg.locator('#sheet .sh-item', has_text='Equalizer').click(); await pg.locator('#sheet .chip', has_text='Bass boost').click()
        eq = await ev("VLC.P.bands?VLC.P.bands.map(b=>b.gain.value):null"); check('equalizer preset applied (Web Audio)', eq and eq[0] == 8, str(eq))
        await ev("const r=document.getElementById('boostR'); r.value=150; r.dispatchEvent(new Event('input'))")
        check('audio boost 150%', abs(await ev('VLC.P.gain.gain.value') - 1.5) < 1e-6)
        await pg.locator('#sheet .chip', has_text='Flat').click(); await ev("const r=document.getElementById('boostR'); r.value=100; r.dispatchEvent(new Event('input'))"); await ev("document.getElementById('scrim').click()")
        # keyboard
        await ev("document.getElementById('pv').pause()"); await pg.keyboard.press(' '); await pg.wait_for_timeout(200)
        check('keyboard Space plays', not await ev('document.getElementById("pv").paused'))
        await ev("document.getElementById('pv').pause(); document.getElementById('pv').currentTime=0"); await pg.keyboard.press('ArrowRight'); await pg.wait_for_timeout(100)
        check('keyboard → +10 s', await ev('document.getElementById("pv").currentTime') >= 9.9)
        await pg.keyboard.press(']'); check('keyboard ] faster', await ev('VLC.P.speed') == 1.25); await pg.keyboard.press('[')
        # mini player
        await ev("document.getElementById('pv').currentTime=5; document.getElementById('pv').play()"); await pg.wait_for_timeout(300)
        await pg.click('#pBack', force=True); await pg.wait_for_timeout(300)
        check('mini player after leaving player', await pg.is_visible('#mini') and not await ev('document.getElementById("pv").paused'))
        await pg.click('#mini .mini-play'); check('mini play/pause', await ev('document.getElementById("pv").paused'))
        await pg.click('#mini .mini-title'); await pg.wait_for_timeout(200); check('tap mini reopens player', await pg.is_visible('#player'))
        await pg.go_back(); await pg.wait_for_timeout(250); check('Android back closes player', not await pg.is_visible('#player'))
        await pg.click('#mini .mini-close'); check('mini close', not await pg.is_visible('#mini'))
        # item menu: rename / favorites / playlist / info / remove+undo
        row = pg.locator('.row[data-kind=media]', has_text='savefromins')
        await row.locator('[data-act=menu]').click(); await pg.locator('#sheet .sh-item', has_text='Rename').click()
        await pg.fill('#promptIn', 'My Renamed Clip'); await pg.click('#promptOk'); await pg.wait_for_timeout(150)
        check('rename in-app', 'My Renamed Clip' in await pg.inner_text('#content'))
        row = pg.locator('.row[data-kind=media]', has_text='My Renamed Clip')
        await row.locator('[data-act=menu]').click(); await pg.locator('#sheet .sh-item', has_text='Add to favorites').click()
        check('favorite', await ev("VLC.S.media.find(m=>m.name==='My Renamed Clip').fav"))
        await row.locator('[data-act=menu]').click(); await pg.locator('#sheet .sh-item', has_text='Add to playlist').click(); await pg.locator('#sheet .sh-item', has_text='New playlist').click()
        await pg.fill('#promptIn', 'Test Playlist'); await pg.click('#promptOk'); await pg.wait_for_timeout(150)
        check('playlist created with item', await ev("VLC.S.playlists.length===1 && VLC.S.playlists[0].items.length===1"))
        g = pg.locator('.row[data-kind=group]', has_text='video_202610'); await g.locator('[data-act=menu]').click(); await pg.locator('#sheet .sh-item', has_text='Add all to playlist').click()
        await pg.locator('#sheet .sh-item', has_text='Test Playlist').click(); check('add folder to playlist', await ev("VLC.S.playlists[0].items.length===8"))
        await row.locator('[data-act=menu]').click(); await pg.locator('#sheet .sh-item', has_text='Information').click()
        check('information sheet', '1280×720' in await pg.inner_text('#sheet')); await ev("document.getElementById('scrim').click()")
        n0 = await ev('VLC.S.media.length')
        await row.locator('[data-act=menu]').click(); await pg.locator('#sheet .sh-item', has_text='Remove from list').click(); await pg.wait_for_timeout(150)
        check('remove from list', await ev('VLC.S.media.length') == n0 - 1)
        await pg.click('#toast button'); await pg.wait_for_timeout(300); check('undo remove', await ev('VLC.S.media.length') == n0)
        # playlists tab + play all
        await pg.click('#tabs .tab:nth-child(2)'); await pg.wait_for_timeout(100)
        check('PLAYLISTS tab lists playlist', 'Test Playlist' in await pg.inner_text('#content'))
        await pg.locator('.row[data-kind=playlist]').click(); await pg.wait_for_timeout(100)
        check('playlist opens 8 items', await pg.locator('#content .row').count() == 8)
        await pg.click('[data-act=pl-play]'); await pg.wait_for_timeout(700); check('playlist play all', await pg.is_visible('#player') and await ev('VLC.P.queue.length') == 8)
        await pg.click('#pNext', force=True); await pg.wait_for_timeout(400); check('next in queue', await ev('VLC.P.idx') == 1)
        await pg.click('#pBack', force=True); await pg.click('#mini .mini-close'); await pg.click('#tbBack'); await pg.click('#tabs .tab:nth-child(1)')
        # audio tab
        if auds:
            await pg.click('#bottomnav [data-nav=audio]'); await pg.wait_for_timeout(100)
            await pg.locator('#content .row').first.click(); await pg.wait_for_timeout(800)
            check('audio plays with art', await pg.is_visible('#audioArt') and not await ev('document.getElementById("pv").paused'))
            await pg.click('#pBack', force=True); await pg.click('#mini .mini-close')
            await pg.click('#bottomnav [data-nav=video]')
        # sort / grid / theme / style
        await pg.click('#btnMenu'); await pg.locator('#sheet .sh-item', has_text='Sort by').click(); await pg.locator('#sheet .sh-item', has_text='Length').click()
        check('sort by length', await ev("VLC.SET.sort") == 'duration')
        await pg.click('#btnMenu'); await pg.locator('#sheet .sh-item', has_text='Grid view').click(); check('grid view', await pg.locator('#content .grid').count() == 1)
        await pg.click('#btnMenu'); await pg.locator('#sheet .sh-item', has_text='List view').click()
        await pg.click('#btnMenu'); await pg.locator('#sheet .sh-item', has_text='Sort by').click(); await pg.locator('#sheet .sh-item', has_text='Name').click()
        await pg.click('#bottomnav [data-nav=more]'); await pg.click('[data-set=theme][data-val=light]'); check('light theme', await ev("document.documentElement.dataset.theme") == 'light')
        await pg.click('[data-set=theme][data-val=dark]'); await pg.click('[data-set=style][data-val=glass]'); check('liquid glass style', await ev("document.documentElement.dataset.style") == 'glass')
        await pg.click('[data-set=style][data-val=classic]'); check('classic style', await ev("document.documentElement.dataset.style") == 'classic')
        await pg.click('[data-set=bgAudio][data-val=false]'); check('background audio setting', await ev('VLC.SET.bgAudio') is False)
        await pg.click('[data-act=history]'); await pg.wait_for_timeout(100); check('playback history list', await pg.locator('#content .row').count() >= 2)
        await pg.click('#tbBack')
        await pg.click('#bottomnav [data-nav=browse]'); check('browse shows favorites', 'My Renamed Clip' in await pg.inner_text('#content'))
        await pg.click('#bottomnav [data-nav=video]')
        # background audio OFF -> leaving player pauses
        await pg.locator('.row[data-kind=media]', has_text='My Renamed Clip').click(); await pg.wait_for_timeout(800)
        await ev("document.getElementById('pv').currentTime=6.5"); await pg.wait_for_timeout(300)
        await pg.click('#pBack', force=True); await pg.wait_for_timeout(200)
        check('bg audio off pauses on leave', await ev('document.getElementById("pv").paused'))
        await pg.click('#mini .mini-close')
        # persistence + resume
        await pg.reload(); await pg.wait_for_timeout(1200)
        check('library persists after reload', await ev('VLC.S.media.length') == n0)
        check('playlist persists', await ev("VLC.S.playlists.length===1 && VLC.S.playlists[0].items.length===8"))
        check('rename persists', await ev("VLC.S.media.some(m=>m.name==='My Renamed Clip')"))
        check('thumbnails after reload', await pg.locator('#content .thumb img').count() >= 6)
        check('subtitle saved with video', await ev("!!VLC.S.media.find(m=>m.name==='My Renamed Clip').sub"))
        await pg.click('#btnResume'); await pg.wait_for_timeout(1200)
        t = await ev('document.getElementById("pv").currentTime'); title = await pg.inner_text('#pTitle')
        check('history icon resumes last video at last position', title == 'My Renamed Clip' and t >= 6, f'{title} @ {t:.2f}')
        await pg.click('#pBack', force=True); await pg.click('#mini .mini-close')
        await pg.click('#fab'); await pg.wait_for_timeout(800); check('orange FAB plays', await pg.is_visible('#player') and not await ev('document.getElementById("pv").paused'))
        check('no JS errors', not errors, '; '.join(errors[:3]))

        # ---------- reduced motion: instant, no animations ----------
        ctx2 = await b.new_context(viewport={'width': 412, 'height': 900}, is_mobile=True, has_touch=True, reduced_motion='reduce')
        p2 = await ctx2.new_page(); err2 = []; p2.on('pageerror', lambda e: err2.append(str(e)))
        await p2.goto(URL + '?style=' + STYLE); await p2.wait_for_timeout(500)
        await p2.evaluate("document.querySelector('#bottomnav [data-nav=audio]').click()")
        r = await p2.evaluate("({anims: document.getAnimations().filter(a=>a.playState==='running' && !(a instanceof CSSAnimation)).length, ghost: !!document.querySelector('.content-ghost'), nav: VLC.S.nav})")
        check('reduced motion: tab change is instant (no slide/ghost)', r['anims'] == 0 and not r['ghost'] and r['nav'] == 'audio', str(r))
        # ---------- APP BUILD RULE: no IDOR via URL params, XSS-safe names ----------
        seen = []
        p2.on('request', lambda rq: seen.append(rq.url))
        await p2.goto(URL + '?id=1&media=1&playlist=1&user=2&uid=abc&file=..%2F..%2Fetc%2Fpasswd&style=' + STYLE); await p2.wait_for_timeout(700)
        check('no IDOR: crafted ?id=/media=/user= params load nothing (empty library)', await p2.evaluate('VLC.S.media.length + VLC.S.playlists.length') == 0 and await p2.locator('.empty [data-act=add-video]').count() == 1)
        from urllib.parse import urlparse
        host = urlparse(URL).netloc
        check('no IDOR: page only loads its own static files (no data API)', all(urlparse(u).netloc == host or u.startswith(('data:', 'blob:')) for u in seen), str([u for u in seen if urlparse(u).netloc != host][:3]))
        import tempfile, shutil
        tmp = tempfile.mkdtemp(); xname = '<img src=x onerror=alert(1)>.mp4'
        shutil.copy(sorted(glob.glob(MEDIA + '/*.mp4'))[0], os.path.join(tmp, xname))
        dialogs = []; p2.on('dialog', lambda d: (dialogs.append(d.message), asyncio.ensure_future(d.dismiss())))
        await p2.set_input_files('#fileVideo', [os.path.join(tmp, xname)])
        for _ in range(40):
            if await p2.evaluate('VLC.S.media.length') >= 1: break
            await p2.wait_for_timeout(250)
        await p2.wait_for_timeout(500)
        inj = await p2.evaluate("document.querySelectorAll('img[src=\"x\"], #content img:not([src^=\"blob:\"]):not([src^=\"data:\"])').length")
        shown = await p2.inner_text('#content')
        check('XSS: file named <img src=x onerror=alert(1)>.mp4 shows as plain text', '<img src=x onerror=alert(1)>' in shown and inj == 0 and not dialogs, f'inj={inj} dialogs={dialogs}')
        await p2.locator('#content .row').first.click(); await p2.wait_for_timeout(700)
        check('XSS: name also plain text in player title', '<img src=x' in await p2.inner_text('#pTitle') and await p2.evaluate("document.querySelectorAll('img[src=\"x\"]').length") == 0 and not dialogs)
        check('reduced-motion/security page: no JS errors', not err2, '; '.join(err2[:3]))
        await ctx2.close(); shutil.rmtree(tmp, ignore_errors=True)

        # ---------- FOLDER ACCESS: scan phone folders (mock File System Access handle) ----------
        import tempfile, shutil
        ctx3 = await b.new_context(viewport={'width': 412, 'height': 900}, is_mobile=True, has_touch=True)
        p3 = await ctx3.new_page(); err3 = []; p3.on('pageerror', lambda e: err3.append(str(e)))
        await p3.add_init_script("""(() => { const c = URL.createObjectURL.bind(URL), r = URL.revokeObjectURL.bind(URL); window.__act = 0; window.__max = 0; const live = new Set();
          URL.createObjectURL = o => { const u = c(o); if (o instanceof File) { live.add(u); window.__act = live.size; window.__max = Math.max(window.__max, live.size); } return u; };
          URL.revokeObjectURL = u => { live.delete(u); window.__act = live.size; return r(u); }; })()""")
        await p3.goto(URL + '?style=' + STYLE); await p3.wait_for_timeout(500)
        tmpd = tempfile.mkdtemp(); vids_all = sorted(glob.glob(MEDIA + '/*.mp4'))[:6]
        open(os.path.join(tmpd, 'notes.txt'), 'w').write('not a video')
        await p3.evaluate("document.body.insertAdjacentHTML('beforeend', '<input id=tmpf type=file multiple>')")
        await p3.set_input_files('#tmpf', vids_all + sorted(glob.glob(MEDIA + '/*.mp3'))[:1] + [os.path.join(tmpd, 'notes.txt')])
        names = await p3.evaluate("""(() => { const F = [...document.getElementById('tmpf').files]; window.__F = F;
          const fh = f => ({ kind: 'file', name: f.name, getFile: async () => f });
          const dh = (name, kids) => { const m = new Map(kids.map(k => [k.name, k])); const h = { kind: 'directory', name, _m: m,
            async *entries() { for (const e of [...m]) yield e; },
            getDirectoryHandle: async n => { const x = m.get(n); if (!x || x.kind !== 'directory') throw new DOMException('no', 'NotFoundError'); return x; },
            getFileHandle: async n => { const x = m.get(n); if (!x || x.kind !== 'file') throw new DOMException('no', 'NotFoundError'); return x; },
            isSameEntry: async o => o === h, queryPermission: async () => window.__perm,
            requestPermission: async () => { window.__asked = (window.__asked || 0) + 1; window.__perm = 'granted'; return 'granted'; } }; return h; };
          const V = F.filter(f => f.name.endsWith('.mp4')), A = F.find(f => f.name.endsWith('.mp3')), T = F.find(f => f.name.endsWith('.txt'));
          window.__perm = 'granted';
          window.__root = dh('DCIM', [dh('Camera', [fh(V[0]), fh(V[1]), fh(T)]), dh('WhatsApp Video', [fh(V[2]), fh(V[3])]), dh('.thumbnails', [fh(V[4])]), fh(A)]);
          window.__fh = fh; window.__V = V;
          window.showDirectoryPicker = async () => window.__root;
          return F.map(f => f.name); })()""")
        await p3.evaluate("""window.__toasts = []; new MutationObserver(() => window.__toasts.push(document.getElementById('toast').textContent)).observe(document.getElementById('toast'), {childList: true, subtree: true, characterData: true})""")
        check('folder: onboarding card offers "Allow access / Folder chuno"', 'Allow access' in await p3.inner_text('.access-card'))
        await p3.click('.access-card [data-act=scan-folder]')
        for _ in range(80):
            if await p3.evaluate('VLC.S.media.length') >= 5 and not await p3.evaluate('VLC.S.scanning'): break
            await p3.wait_for_timeout(250)
        await p3.wait_for_timeout(400)
        lib = await p3.evaluate("VLC.S.media.map(m => ({n: m.file, k: m.kind, f: m.folder, t: !!m.thumb, d: m.duration}))")
        check('folder scan: finds every video + audio recursively', len(lib) == 5 and sum(1 for x in lib if x['k'] == 'video') == 4, str([(x['n'], x['f']) for x in lib]))
        check('folder scan: skips non-media (.txt) and hidden folders', not any(x['n'].endswith('.txt') for x in lib) and not any(x['n'] == os.path.basename(vids_all[4]) for x in lib))
        check('folder scan: real thumbnails + durations', all(x['d'] > 0 for x in lib) and all(x['t'] for x in lib if x['k'] == 'video'))
        txt = await p3.inner_text('#content')
        check('folder scan: grouped by phone folder like VLC (Camera, WhatsApp Video)', 'Camera' in txt and 'WhatsApp Video' in txt and txt.count('2 videos') >= 2, txt[:120].replace('\n', ' | '))
        check('folder scan: progress shown ("N videos mile…")', any('videos mile' in t for t in await p3.evaluate('window.__toasts')))
        mx = await p3.evaluate('window.__max')
        check('folder scan: max 2 thumbnails at a time', 1 <= mx <= 2, f'max concurrent {mx}')
        check('folder scan: folder remembered (More → Media folders)', await p3.evaluate('VLC.S.dirs.length') == 1)
        # dedupe
        await p3.evaluate("VLC.linkFolder(window.__root)"); await p3.wait_for_timeout(1200)
        check('dedupe: same folder picked again adds nothing', await p3.evaluate('VLC.S.media.length') == 5 and await p3.evaluate('VLC.S.dirs.length') == 1)
        await p3.set_input_files('#fileVideo', vids_all[:1]); await p3.wait_for_timeout(1000)
        check('dedupe: same file via "Add videos" is skipped (name+size+lastModified)', await p3.evaluate('VLC.S.media.length') == 5)
        # rescan: one removed, one new
        await p3.evaluate("""(() => { const cam = window.__root._m.get('Camera'), wa = window.__root._m.get('WhatsApp Video'); cam._m.delete(window.__V[1].name); wa._m.set(window.__V[5].name, window.__fh(window.__V[5])); })()""")
        r = await p3.evaluate('VLC.rescanAll()')
        check('rescan: new file added + deleted file removed', r and r[0] and r[0]['added'] == 1 and r[0]['removed'] == 1 and await p3.evaluate('VLC.S.media.length') == 5, str(r))
        # permission lost → one-tap "Refresh access"
        await p3.evaluate("window.__perm = 'prompt'; window.__asked = 0")
        await p3.evaluate('VLC.rescanDir(VLC.S.dirs[0])'); await p3.wait_for_timeout(200)
        check('permission "prompt": shows Refresh access button', await p3.locator('.access-bar [data-act=refresh-access]').count() == 1)
        await p3.click('.access-bar [data-act=refresh-access]'); await p3.wait_for_timeout(1500)
        check('Refresh access: asks permission once and rescans', await p3.evaluate('window.__asked') == 1 and await p3.evaluate('VLC.S.dirs[0].perm') == 'granted' and await p3.locator('.access-bar [data-act=refresh-access]').count() == 0)
        f = await p3.evaluate("VLCSources.fileAt(window.__root, 'WhatsApp Video/' + window.__V[2].name).then(f => f.name)")
        check('saved folder: file re-opened by path (no copy of big videos stored)', f == os.path.basename(vids_all[2]) and await p3.evaluate("VLC.S.media.filter(m => m.src).every(m => !m.hasBlob)"))
        await p3.locator('#content .row[data-kind=group]', has_text='WhatsApp Video').click(); await p3.wait_for_timeout(300)
        await p3.locator('#content .row[data-kind=media]').first.click(); await p3.wait_for_timeout(1500)
        check('folder video plays', await p3.evaluate("!document.getElementById('pv').paused && document.getElementById('pv').currentTime > 0.2"))
        check('folder tests: no JS errors', not err3, '; '.join(err3[:3]))
        await ctx3.close()
        # fallback: browsers without showDirectoryPicker → <input webkitdirectory>
        ctx4 = await b.new_context(viewport={'width': 412, 'height': 900}, is_mobile=True, has_touch=True)
        p4 = await ctx4.new_page(); err4 = []; p4.on('pageerror', lambda e: err4.append(str(e)))
        await p4.add_init_script("delete window.showDirectoryPicker")
        await p4.goto(URL + '?style=' + STYLE); await p4.wait_for_timeout(500)
        check('fallback: card says "Poora folder chuno" when folder picker is missing', 'Poora folder chuno' in await p4.inner_text('.access-card'))
        root_dir = os.path.join(tmpd, 'Movies'); wa_dir = os.path.join(root_dir, 'WhatsApp Video'); os.makedirs(wa_dir)
        for v in vids_all[:3]: shutil.copy(v, wa_dir)
        shutil.copy(vids_all[3], root_dir); shutil.copy(os.path.join(tmpd, 'notes.txt'), wa_dir)
        async with p4.expect_file_chooser() as fc:
            await p4.click('.access-card [data-act=scan-folder]')
        chooser = await fc.value
        check('fallback: opens a folder chooser (webkitdirectory)', await p4.evaluate("document.getElementById('fileDir').webkitdirectory"))
        await chooser.set_files(root_dir)
        for _ in range(60):
            if await p4.evaluate('VLC.S.media.length') >= 4: break
            await p4.wait_for_timeout(250)
        await p4.wait_for_timeout(500)
        lib = await p4.evaluate("VLC.S.media.map(m => [m.file, m.folder])")
        check('fallback: whole folder added, grouped by folder, .txt ignored', len(lib) == 4 and sum(1 for x in lib if x[1] == 'WhatsApp Video') == 3 and 'WhatsApp Video' in await p4.inner_text('#content'), str(lib))
        await p4.set_input_files('#fileDir', root_dir); await p4.wait_for_timeout(1200)
        check('fallback dedupe: same folder again adds nothing', await p4.evaluate('VLC.S.media.length') == 4)
        check('fallback tests: no JS errors', not err4, '; '.join(err4[:3]))
        await ctx4.close(); shutil.rmtree(tmpd, ignore_errors=True)
        await b.close()
    fails = [r for r in results if not r[1]]
    print(f'\n{len(results) - len(fails)}/{len(results)} passed'); sys.exit(1 if fails else 0)
asyncio.run(main())
