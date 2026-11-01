#!/usr/bin/env python3
"""Smoke test for the VLC clone. Run BEFORE every publish:
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
        await b.close()
    fails = [r for r in results if not r[1]]
    print(f'\n{len(results) - len(fails)}/{len(results)} passed'); sys.exit(1 if fails else 0)
asyncio.run(main())
