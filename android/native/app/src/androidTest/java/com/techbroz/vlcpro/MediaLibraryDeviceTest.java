package com.techbroz.vlcpro;

import static org.junit.Assert.*;

import android.Manifest;
import android.content.Context;
import android.net.Uri;
import android.os.Build;
import android.util.Log;
import android.webkit.WebResourceResponse;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import com.getcapacitor.JSArray;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;
import org.json.JSONObject;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

/** On-device check: the MediaStore scan finds the test videos pushed to /sdcard/Movies and /sdcard/DCIM,
 *  thumbnails are made, and the media handler serves real bytes with Range support (what <video> needs). */
@RunWith(AndroidJUnit4.class)
public class MediaLibraryDeviceTest {
    private Context ctx;

    @Before public void grant() {
        ctx = InstrumentationRegistry.getInstrumentation().getTargetContext();
        android.app.UiAutomation ua = InstrumentationRegistry.getInstrumentation().getUiAutomation();
        if (Build.VERSION.SDK_INT >= 33) {
            ua.grantRuntimePermission(ctx.getPackageName(), Manifest.permission.READ_MEDIA_VIDEO);
            ua.grantRuntimePermission(ctx.getPackageName(), Manifest.permission.READ_MEDIA_AUDIO);
        } else {
            ua.grantRuntimePermission(ctx.getPackageName(), Manifest.permission.READ_EXTERNAL_STORAGE);
        }
    }

    private JSONObject find(JSArray items, String name) throws Exception {
        for (int i = 0; i < items.length(); i++) { JSONObject o = items.getJSONObject(i); if (name.equals(o.getString("name"))) return o; }
        return null;
    }

    @Test public void scanFindsVideosByFolderAndServesThem() throws Exception {
        try (android.database.Cursor c0 = ctx.getContentResolver().query(android.provider.MediaStore.Video.Media.EXTERNAL_CONTENT_URI, null, null, null, null)) {
            Log.i("VLCPRO_TEST", "bare video rows=" + (c0 == null ? -1 : c0.getCount()) + " perm=" + ctx.checkSelfPermission(Manifest.permission.READ_MEDIA_VIDEO));
        }
        JSArray items = MediaLibrary.scan(ctx);
        Log.i("VLCPRO_TEST", "scan items=" + items.toString());
        JSONObject movie = find(items, "Holiday_Trip_720p.mp4");
        JSONObject cam = find(items, "Camera_Clip_480p.mp4");
        JSONObject song = find(items, "Test_Song.mp3");
        assertNotNull("Movies video found", movie);
        assertNotNull("DCIM/Camera video found", cam);
        assertNotNull("Music mp3 found", song);
        assertEquals("Movies", movie.getString("folder"));
        assertEquals("Camera", cam.getString("folder"));
        assertEquals(1280, movie.getInt("w"));
        assertEquals(720, movie.getInt("h"));
        assertTrue("duration ~8s", Math.abs(movie.getDouble("duration") - 8.0) < 0.6);
        assertEquals("audio", song.getString("kind"));
        assertTrue(movie.getString("src").startsWith("https://localhost/_vlcmedia/video/"));

        long id = Long.parseLong(movie.getString("nid").split(":")[1]);
        Uri uri = MediaWebViewClient.contentUri("video", id);

        // full request
        WebResourceResponse full = MediaWebViewClient.serve(ctx.getContentResolver(), uri, new HashMap<>());
        assertEquals(200, full.getStatusCode());
        assertEquals("video/mp4", full.getMimeType());
        long len = Long.parseLong(full.getResponseHeaders().get("Content-Length"));
        assertEquals(movie.getLong("size"), len);
        full.getData().close();

        // ranged request like a <video> seek
        Map<String, String> h = new HashMap<>(); h.put("Range", "bytes=1000-1999");
        WebResourceResponse part = MediaWebViewClient.serve(ctx.getContentResolver(), uri, h);
        assertEquals(206, part.getStatusCode());
        assertEquals("bytes 1000-1999/" + len, part.getResponseHeaders().get("Content-Range"));
        InputStream in = part.getData(); byte[] buf = new byte[4096]; int n, total = 0;
        while ((n = in.read(buf)) > 0) total += n; in.close();
        assertEquals(1000, total);

        // open-ended range, first bytes are an MP4 'ftyp' box
        h.put("Range", "bytes=0-");
        WebResourceResponse head = MediaWebViewClient.serve(ctx.getContentResolver(), uri, h);
        assertEquals(206, head.getStatusCode());
        byte[] b = new byte[12]; InputStream hin = head.getData(); int got = 0; while (got < 12) { int r = hin.read(b, got, 12 - got); if (r < 0) break; got += r; } hin.close();
        assertEquals("ftyp", new String(b, 4, 4, "US-ASCII"));

        // thumbnail
        byte[] jpg = MediaWebViewClient.thumbJpeg(ctx.getContentResolver(), "video", uri, id);
        assertNotNull("thumbnail made", jpg);
        assertTrue(jpg.length > 500 && (jpg[0] & 0xff) == 0xFF && (jpg[1] & 0xff) == 0xD8);
        Log.i("VLCPRO_TEST", "OK movie=" + movie.getString("folder") + " cam=" + cam.getString("folder") + " len=" + len + " thumbBytes=" + jpg.length);
    }
}
