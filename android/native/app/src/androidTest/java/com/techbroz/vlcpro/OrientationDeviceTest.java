package com.techbroz.vlcpro;

import static org.junit.Assert.*;

import android.content.pm.ActivityInfo;
import android.util.Log;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import org.junit.Test;
import org.junit.runner.RunWith;

/** The app is not locked to portrait, the player's fullscreen handler is installed, and the native
 *  orientation switch (used by Rotate / Fullscreen) really turns the screen to landscape and back. */
@RunWith(AndroidJUnit4.class)
public class OrientationDeviceTest {
    @Test public void notLockedAndCanRotate() throws Exception {
        try (ActivityScenario<MainActivity> sc = ActivityScenario.launch(MainActivity.class)) {
            final int[] req = new int[1];
            final boolean[] fs = new boolean[1];
            sc.onActivity(a -> {
                req[0] = a.getRequestedOrientation();
                fs[0] = a.getBridge().getWebView().getWebChromeClient() instanceof FullscreenChromeClient;
            });
            assertEquals("not locked", ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED, req[0]);
            assertTrue("fullscreen video handler installed", fs[0]);
            sc.onActivity(a -> a.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE));
            Thread.sleep(4000);
            final int[] o = new int[2];
            sc.onActivity(a -> { o[0] = a.getResources().getConfiguration().orientation; o[1] = System.identityHashCode(a); });
            Log.i("VLCPRO_TEST", "after landscape: config.orientation=" + o[0]);
            assertEquals("landscape", android.content.res.Configuration.ORIENTATION_LANDSCAPE, o[0]);
            sc.onActivity(a -> a.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED));
            Log.i("VLCPRO_TEST", "OK orientation");
        }
    }
}
