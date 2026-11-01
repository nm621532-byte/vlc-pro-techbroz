package com.techbroz.vlcpro;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(MediaScanPlugin.class);
        super.onCreate(savedInstanceState);
        // Serve phone media (MediaStore content://) to our own WebView only, with Range support.
        if (bridge != null) {
            bridge.setWebViewClient(new MediaWebViewClient(bridge));
            bridge.getWebView().setWebChromeClient(new FullscreenChromeClient(bridge));
        }
    }
}
