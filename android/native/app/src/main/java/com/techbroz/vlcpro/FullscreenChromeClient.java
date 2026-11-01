package com.techbroz.vlcpro;

import android.app.Activity;
import android.content.pm.ActivityInfo;
import android.graphics.Color;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeWebChromeClient;

/** Real fullscreen for the player (Element.requestFullscreen / video fullscreen): the web view's fullscreen
 *  element is shown over the whole screen with the status + navigation bars hidden. Rotation is free
 *  (follows the phone) unless the web app locks it via VlcMedia.setOrientation / screen.orientation.lock. */
public class FullscreenChromeClient extends BridgeWebChromeClient {
    private final Bridge bridge;
    private View custom;
    private CustomViewCallback callback;

    public FullscreenChromeClient(Bridge bridge) { super(bridge); this.bridge = bridge; }

    @Override
    public void onShowCustomView(View view, CustomViewCallback cb) {
        Activity a = bridge.getActivity();
        if (custom != null) { onHideCustomView(); }
        custom = view; callback = cb;
        ViewGroup decor = (ViewGroup) a.getWindow().getDecorView();
        view.setBackgroundColor(Color.BLACK);
        decor.addView(view, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        // Back button leaves fullscreen (instead of closing the app)
        view.setFocusable(true); view.setFocusableInTouchMode(true); view.requestFocus();
        view.setOnKeyListener((v, keyCode, ev) -> {
            if (keyCode == android.view.KeyEvent.KEYCODE_BACK && ev.getAction() == android.view.KeyEvent.ACTION_UP) { onHideCustomView(); return true; }
            return keyCode == android.view.KeyEvent.KEYCODE_BACK;
        });
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(a.getWindow(), decor);
        c.hide(WindowInsetsCompat.Type.systemBars());
        c.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }

    @Override
    public void onHideCustomView() {
        Activity a = bridge.getActivity();
        ViewGroup decor = (ViewGroup) a.getWindow().getDecorView();
        if (custom != null) { decor.removeView(custom); custom = null; }
        WindowCompat.getInsetsController(a.getWindow(), decor).show(WindowInsetsCompat.Type.systemBars());
        // leaving fullscreen: go back to following the phone's rotation
        a.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
        if (callback != null) { callback.onCustomViewHidden(); callback = null; }
    }

    public boolean isFullscreen() { return custom != null; }
}
