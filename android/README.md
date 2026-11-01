# VLC Pro — Android app (APK)

Ye folder VLC Pro ka **Android app** hai. Same VLC Pro web app (repo root ki files) ko ek Android shell ([Capacitor](https://capacitorjs.com)) mein wrap kiya gaya hai, plus ek chhota native plugin jo phone ke saare videos aur gaane khud dhoondh leta hai — bilkul real VLC ki tarah.

**Download:** [VLC-Pro.apk (GitHub Release v1.0)](../../releases/tag/v1.0)

## Kya karta hai
- Pehli baar kholne par ek screen: **"Saare videos dikhane ke liye permission do"** → Permission do.
- Permission milte hi poora phone scan: DCIM / Camera, Movies, WhatsApp Video, Download… sab **folder-wise** dikhte hain (jaise real VLC).
- Har baar app kholne par, app pe wapas aane par, aur **neeche kheenchne (pull-to-refresh)** par naye videos khud aa jaate hain; delete hue videos list se hat jaate hain.
- Gaane (MP3/M4A…) Audio tab mein.
- "Ek-ek video chuno" (manual add) ab bhi kaam karta hai.
- Permission mana kar di? → "Settings kholo" button seedha app ki settings kholta hai.

## Privacy (Noor ka APP BUILD RULE)
1. **Data sirf phone pe** — app mein `INTERNET` permission hi nahi hai, to app kuch bhi upload kar hi nahi sakta. Library, playlists, settings sab phone ke andar.
2. **Smoke test before publish** — web smoke test (`test/smoke_test.py`) + native layer test (`native/app/src/androidTest/…/MediaLibraryDeviceTest.java`, Android emulator pe chalaya).
3. **No IDOR / no file exposure** — koi deep link nahi, koi file share nahi; sirf launcher screen exported hai. Videos ek private address (`https://localhost/_vlcmedia/…`) se chalte hain jo sirf isi app ki screen khol sakti hai.

Permissions: `READ_MEDIA_VIDEO` + `READ_MEDIA_AUDIO` (Android 13+), `READ_EXTERNAL_STORAGE` (sirf Android 12 aur purane). Android 7.0 (API 24) se Android 14+ tak.

## Code kahan hai
| File | Kaam |
|---|---|
| `../native.js` | Permission screen, phone scan, folder-wise library, pull-to-refresh (web app ka part, browser mein kuch nahi karta) |
| `native/app/src/main/java/com/techbroz/vlcpro/MediaScanPlugin.java` | Capacitor plugin **VlcMedia**: `checkPerm`, `requestPerm`, `scan`, `openSettings` |
| `native/app/src/main/java/com/techbroz/vlcpro/MediaLibrary.java` | MediaStore se videos + audio padhna (naam, folder, duration, 720p/1080p, size, date) |
| `native/app/src/main/java/com/techbroz/vlcpro/MediaWebViewClient.java` | Video ko phone se seedha stream karna (Range/seek support) + Android ke apne thumbnails |

## Khud build karna (laptop pe)
Zaroorat: Node 18+, JDK 17, Android SDK (platform 34).
```bash
cd android
npm install
npm run sync                 # web files www/ mein copy + Capacitor sync
cd native && ./gradlew assembleDebug        # app/build/outputs/apk/debug/app-debug.apk
```
Release (signed) build ke liye `android/keystore.properties` banao (ye file GitHub pe **kabhi** mat daalo):
```
storeFile=/full/path/vlcpro-release.jks
storePassword=...
keyAlias=vlcpro
keyPassword=...
```
phir `cd native && ./gradlew assembleRelease`.

> Educational project by Tech Bro Z — not affiliated with VideoLAN. "VLC" is a trademark of VideoLAN.
