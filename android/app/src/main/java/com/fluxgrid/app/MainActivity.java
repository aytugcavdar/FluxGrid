package com.fluxgrid.app;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Optimize WebView for better rendering performance
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            // Disable hardware acceleration frame rate hints to prevent -4.0 warnings
            webView.setLayerType(WebView.LAYER_TYPE_HARDWARE, null);
            
            // Enable smooth scrolling and rendering
            webView.setScrollBarStyle(WebView.SCROLLBARS_OUTSIDE_OVERLAY);
            webView.setScrollbarFadingEnabled(true);
        }
    }
}
