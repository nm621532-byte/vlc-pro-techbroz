package com.techbroz.vlcpro;

import android.content.ContentResolver;
import android.content.Context;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import java.io.File;
import java.util.ArrayList;
import java.util.List;

/** Reads the phone's video + audio library from MediaStore (read-only, nothing leaves the phone). */
public final class MediaLibrary {
    private MediaLibrary() {}

    public static JSArray scan(Context ctx) {
        JSArray items = new JSArray();
        query(ctx, "video", MediaStore.Video.Media.EXTERNAL_CONTENT_URI, items);
        query(ctx, "audio", MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, items);
        return items;
    }

    static void query(Context ctx, String kind, Uri uri, JSArray out) {
        ContentResolver cr = ctx.getContentResolver();
        boolean video = "video".equals(kind);
        List<String> cols = new ArrayList<>();
        cols.add(MediaStore.MediaColumns._ID);
        cols.add(MediaStore.MediaColumns.DISPLAY_NAME);
        cols.add(MediaStore.MediaColumns.SIZE);
        cols.add(MediaStore.MediaColumns.DATE_MODIFIED);
        cols.add(MediaStore.MediaColumns.DATE_ADDED);
        cols.add(MediaStore.MediaColumns.MIME_TYPE);
        cols.add("duration");
        if (video) { cols.add("width"); cols.add("height"); cols.add(MediaStore.Video.VideoColumns.BUCKET_DISPLAY_NAME); }
        else { cols.add(MediaStore.Audio.AudioColumns.TITLE); cols.add(MediaStore.Audio.AudioColumns.ARTIST); cols.add(MediaStore.Audio.AudioColumns.ALBUM); }
        if (Build.VERSION.SDK_INT >= 29) { cols.add(MediaStore.MediaColumns.RELATIVE_PATH); if (!video) cols.add("bucket_display_name"); }
        else cols.add(MediaStore.MediaColumns.DATA);
        String sel = null;
        if (!video) sel = MediaStore.Audio.AudioColumns.IS_MUSIC + " != 0 OR " + MediaStore.MediaColumns.MIME_TYPE + " LIKE 'audio/%'";
        try (Cursor c = cr.query(uri, cols.toArray(new String[0]), sel, null, MediaStore.MediaColumns.DATE_MODIFIED + " DESC")) {
            if (c == null) return;
            while (c.moveToNext()) {
                JSObject o = new JSObject();
                long id = c.getLong(c.getColumnIndexOrThrow(MediaStore.MediaColumns._ID));
                String name = str(c, MediaStore.MediaColumns.DISPLAY_NAME);
                String rel = null, folder = null;
                if (Build.VERSION.SDK_INT >= 29) {
                    rel = str(c, MediaStore.MediaColumns.RELATIVE_PATH);
                    folder = str(c, "bucket_display_name");
                } else {
                    String data = str(c, MediaStore.MediaColumns.DATA);
                    if (data != null) { File f = new File(data); File p = f.getParentFile(); if (p != null) { folder = p.getName(); rel = p.getPath(); } if (name == null) name = f.getName(); }
                }
                if (video && folder == null) folder = str(c, MediaStore.Video.VideoColumns.BUCKET_DISPLAY_NAME);
                if (folder == null && rel != null) { String t = rel.replaceAll("/+$", ""); folder = t.contains("/") ? t.substring(t.lastIndexOf('/') + 1) : t; }
                if (folder == null || folder.isEmpty()) folder = "Internal memory";
                o.put("nid", kind + ":" + id);
                o.put("kind", kind);
                o.put("name", name == null ? (kind + " " + id) : name);
                o.put("folder", folder);
                o.put("path", rel == null ? "" : rel);
                o.put("duration", lng(c, "duration") / 1000.0);
                if (video) { o.put("w", lng(c, "width")); o.put("h", lng(c, "height")); }
                else { o.put("title", str(c, MediaStore.Audio.AudioColumns.TITLE)); o.put("artist", str(c, MediaStore.Audio.AudioColumns.ARTIST)); o.put("album", str(c, MediaStore.Audio.AudioColumns.ALBUM)); }
                o.put("size", lng(c, MediaStore.MediaColumns.SIZE));
                long mod = lng(c, MediaStore.MediaColumns.DATE_MODIFIED);
                if (mod == 0) mod = lng(c, MediaStore.MediaColumns.DATE_ADDED);
                o.put("date", mod * 1000);
                o.put("mime", str(c, MediaStore.MediaColumns.MIME_TYPE));
                o.put("src", "https://localhost/_vlcmedia/" + kind + "/" + id);
                o.put("thumbSrc", "https://localhost/_vlcthumb/" + kind + "/" + id);
                out.put(o);
            }
        }
    }

    private static String str(Cursor c, String col) { int i = c.getColumnIndex(col); return (i < 0 || c.isNull(i)) ? null : c.getString(i); }
    private static long lng(Cursor c, String col) { int i = c.getColumnIndex(col); return (i < 0 || c.isNull(i)) ? 0 : c.getLong(i); }
}
