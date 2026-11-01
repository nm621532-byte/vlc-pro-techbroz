package com.techbroz.vlcpro;

import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.res.AssetFileDescriptor;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;
import android.util.Size;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeWebViewClient;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

/**
 * Intercepts https://localhost/_vlcmedia/{video|audio}/{id} and /_vlcthumb/{video|audio}/{id}.
 * Only this app's own WebView can reach these paths (nothing is exported to other apps),
 * and only ids that MediaStore exposes to this app under the granted permission resolve.
 */
public class MediaWebViewClient extends BridgeWebViewClient {
    private final Bridge bridge;

    public MediaWebViewClient(Bridge bridge) { super(bridge); this.bridge = bridge; }

    @Override
    public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
        Uri url = request.getUrl();
        String host = url.getHost();
        String path = url.getPath();
        if ("localhost".equals(host) && path != null && (path.startsWith("/_vlcmedia/") || path.startsWith("/_vlcthumb/"))) {
            try {
                String[] seg = path.split("/");
                if (seg.length < 4) return error(404);
                String kind = seg[2];
                long id = Long.parseLong(seg[3]);
                Uri content = contentUri(kind, id);
                if (content == null) return error(404);
                if (path.startsWith("/_vlcthumb/")) return thumb(kind, content, id);
                return media(content, request.getRequestHeaders());
            } catch (Exception e) {
                return error(404);
            }
        }
        return super.shouldInterceptRequest(view, request);
    }

    static Uri contentUri(String kind, long id) {
        if ("video".equals(kind)) return ContentUris.withAppendedId(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, id);
        if ("audio".equals(kind)) return ContentUris.withAppendedId(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, id);
        return null;
    }

    static WebResourceResponse error404() { return errorStatic(404); }
    private WebResourceResponse error(int code) { return errorStatic(code); }
    static WebResourceResponse errorStatic(int code) {
        WebResourceResponse r = new WebResourceResponse("text/plain", "utf-8", new ByteArrayInputStream(new byte[0]));
        r.setStatusCodeAndReasonPhrase(code, code == 404 ? "Not Found" : "Error");
        return r;
    }

    private WebResourceResponse thumb(String kind, Uri content, long id) throws IOException {
        byte[] jpg = thumbJpeg(bridge.getContext().getContentResolver(), kind, content, id);
        if (jpg == null) return error(404);
        WebResourceResponse r = new WebResourceResponse("image/jpeg", null, new ByteArrayInputStream(jpg));
        Map<String, String> h = new HashMap<>();
        h.put("Cache-Control", "max-age=86400");
        r.setResponseHeaders(h);
        r.setStatusCodeAndReasonPhrase(200, "OK");
        return r;
    }

    /** Small JPEG thumbnail (320x180 box) made by Android itself; null if the phone has none. */
    static byte[] thumbJpeg(ContentResolver cr, String kind, Uri content, long id) throws IOException {
        Bitmap bmp = null;
        if (Build.VERSION.SDK_INT >= 29) {
            try { bmp = cr.loadThumbnail(content, new Size(320, 180), null); } catch (IOException e) { bmp = null; }
        } else if ("video".equals(kind)) {
            bmp = MediaStore.Video.Thumbnails.getThumbnail(cr, id, MediaStore.Video.Thumbnails.MINI_KIND, null);
        }
        if (bmp == null) return null;
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        bmp.compress(Bitmap.CompressFormat.JPEG, 80, out);
        return out.toByteArray();
    }

    private WebResourceResponse media(Uri content, Map<String, String> reqHeaders) throws IOException {
        return serve(bridge.getContext().getContentResolver(), content, reqHeaders);
    }

    /** Builds the (ranged) response for one MediaStore item. Static so the on-device test can call it. */
    static WebResourceResponse serve(ContentResolver cr, Uri content, Map<String, String> reqHeaders) throws IOException {
        String mime = cr.getType(content);
        if (mime == null) mime = "video/mp4";
        AssetFileDescriptor afd = cr.openAssetFileDescriptor(content, "r");
        if (afd == null) return error404();
        long total = afd.getLength();
        FileInputStream fis = afd.createInputStream();
        if (total < 0) total = fis.getChannel().size();
        String range = null;
        for (Map.Entry<String, String> e : reqHeaders.entrySet()) if ("range".equalsIgnoreCase(e.getKey())) range = e.getValue();
        Map<String, String> h = new HashMap<>();
        h.put("Accept-Ranges", "bytes");
        h.put("Cache-Control", "no-cache");
        if (range != null && range.startsWith("bytes=")) {
            String[] p = range.substring(6).split("-", -1);
            long start = p[0].isEmpty() ? 0 : Long.parseLong(p[0].trim());
            long end = (p.length > 1 && !p[1].trim().isEmpty()) ? Long.parseLong(p[1].trim()) : total - 1;
            if (p[0].isEmpty() && p.length > 1 && !p[1].trim().isEmpty()) { start = Math.max(0, total - Long.parseLong(p[1].trim())); end = total - 1; }
            if (end >= total) end = total - 1;
            if (start > end || start >= total) { fis.close(); afd.close(); WebResourceResponse r = error404(); h.put("Content-Range", "bytes */" + total); r.setResponseHeaders(h); r.setStatusCodeAndReasonPhrase(416, "Range Not Satisfiable"); return r; }
            long len = end - start + 1;
            skipFully(fis, start);
            h.put("Content-Range", "bytes " + start + "-" + end + "/" + total);
            h.put("Content-Length", String.valueOf(len));
            WebResourceResponse r = new WebResourceResponse(mime, null, new Bounded(fis, len, afd));
            r.setStatusCodeAndReasonPhrase(206, "Partial Content");
            r.setResponseHeaders(h);
            return r;
        }
        h.put("Content-Length", String.valueOf(total));
        WebResourceResponse r = new WebResourceResponse(mime, null, new Bounded(fis, total, afd));
        r.setStatusCodeAndReasonPhrase(200, "OK");
        r.setResponseHeaders(h);
        return r;
    }

    private static void skipFully(InputStream in, long n) throws IOException {
        while (n > 0) { long s = in.skip(n); if (s <= 0) throw new IOException("skip failed"); n -= s; }
    }

    /** Reads at most `left` bytes, then closes the descriptor. */
    static class Bounded extends InputStream {
        private final InputStream in; private long left; private final AssetFileDescriptor afd;
        Bounded(InputStream in, long left, AssetFileDescriptor afd) { this.in = in; this.left = left; this.afd = afd; }
        @Override public int read() throws IOException { if (left <= 0) return -1; int b = in.read(); if (b >= 0) left--; return b; }
        @Override public int read(byte[] b, int off, int len) throws IOException {
            if (left <= 0) return -1;
            int n = in.read(b, off, (int) Math.min(len, left));
            if (n > 0) left -= n;
            return n;
        }
        @Override public int available() throws IOException { return (int) Math.min(in.available(), left); }
        @Override public void close() throws IOException { try { in.close(); } finally { afd.close(); } }
    }
}
