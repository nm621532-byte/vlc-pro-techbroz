package com.techbroz.vlcpro;

import android.Manifest;
import android.content.ContentResolver;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;
import android.provider.Settings;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.io.File;
import java.util.ArrayList;
import java.util.List;

/** Reads the phone's video/audio library from MediaStore. Nothing leaves the phone. */
@CapacitorPlugin(
    name = "VlcMedia",
    permissions = {
        @Permission(alias = "media", strings = { Manifest.permission.READ_MEDIA_VIDEO, Manifest.permission.READ_MEDIA_AUDIO }),
        @Permission(alias = "storage", strings = { Manifest.permission.READ_EXTERNAL_STORAGE })
    }
)
public class MediaScanPlugin extends Plugin {

    private String alias() { return Build.VERSION.SDK_INT >= 33 ? "media" : "storage"; }

    private boolean limited() {
        return Build.VERSION.SDK_INT >= 34 && getContext().checkSelfPermission("android.permission.READ_MEDIA_VISUAL_USER_SELECTED") == android.content.pm.PackageManager.PERMISSION_GRANTED;
    }

    private JSObject status() {
        JSObject r = new JSObject();
        PermissionState s = getPermissionState(alias());
        String st = s == null ? "prompt" : s.toString();
        if (!"granted".equals(st) && limited()) st = "limited";
        r.put("media", st);
        r.put("sdk", Build.VERSION.SDK_INT);
        return r;
    }

    @PluginMethod
    public void checkPerm(PluginCall call) { call.resolve(status()); }

    @PluginMethod
    public void requestPerm(PluginCall call) {
        if (getPermissionState(alias()) == PermissionState.GRANTED) { call.resolve(status()); return; }
        requestPermissionForAlias(alias(), call, "permCallback");
    }

    @PermissionCallback
    private void permCallback(PluginCall call) { call.resolve(status()); }

    @PluginMethod
    public void openSettings(PluginCall call) {
        Intent i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.fromParts("package", getContext().getPackageName(), null));
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(i);
        call.resolve();
    }

    /** setOrientation({ mode: 'landscape' | 'portrait' | 'auto' }) — used by the player's Rotate / Fullscreen buttons
     *  (Android WebView does not implement screen.orientation.lock, native.js routes it here). */
    @PluginMethod
    public void setOrientation(PluginCall call) {
        String mode = call.getString("mode", "auto");
        int o;
        switch (mode == null ? "auto" : mode) {
            case "landscape": case "landscape-primary": case "landscape-secondary": o = ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE; break;
            case "portrait": case "portrait-primary": case "portrait-secondary": o = ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT; break;
            default: o = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED; mode = "auto";
        }
        final int fo = o; final String fm = mode;
        getActivity().runOnUiThread(() -> {
            getActivity().setRequestedOrientation(fo);
            JSObject r = new JSObject(); r.put("mode", fm); call.resolve(r);
        });
    }

    @PluginMethod
    public void scan(PluginCall call) {
        getBridge().execute(() -> {
            try {
                JSArray items = MediaLibrary.scan(getContext());
                JSObject r = status();
                r.put("items", items);
                call.resolve(r);
            } catch (Exception e) {
                call.reject("scan failed: " + e.getMessage());
            }
        });
    }

}
