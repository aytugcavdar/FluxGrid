package com.fluxgrid.app;

import android.os.Bundle;
import android.os.Build;
import android.webkit.WebView;
import android.webkit.WebSettings;
import android.view.WindowManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.webkit.JavascriptInterface;
import android.app.PictureInPictureParams;
import android.util.Rational;
import android.content.res.Configuration;
import com.getcapacitor.BridgeActivity;
import com.fluxgrid.app.widget.StatsWidgetProvider;
import com.google.firebase.crashlytics.FirebaseCrashlytics;

public class MainActivity extends BridgeActivity {
    
    private DynamicShortcutManager dynamicShortcutManager;
    private boolean isInPipMode = false;
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Initialize Firebase Crashlytics
        FirebaseCrashlytics crashlytics = FirebaseCrashlytics.getInstance();
        crashlytics.setCrashlyticsCollectionEnabled(true);
        
        // Initialize dynamic shortcut manager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N_MR1) {
            dynamicShortcutManager = new DynamicShortcutManager(this);
        }
        
        // Keep screen on during gameplay
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        
        // Create notification channels
        createNotificationChannels();
        
        // Optimize WebView for better rendering performance
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            WebSettings settings = webView.getSettings();
            
            // Enable hardware acceleration
            webView.setLayerType(WebView.LAYER_TYPE_HARDWARE, null);
            
            // Performance optimizations
            settings.setRenderPriority(WebSettings.RenderPriority.HIGH);
            settings.setCacheMode(WebSettings.LOAD_DEFAULT);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            
            // Disable unnecessary features for better performance
            settings.setGeolocationEnabled(false);
            settings.setSaveFormData(false);
            settings.setSavePassword(false);
            
            // Enable smooth scrolling and rendering
            webView.setScrollBarStyle(WebView.SCROLLBARS_OUTSIDE_OVERLAY);
            webView.setScrollbarFadingEnabled(true);
            
            // Add JavaScript interface for widget updates and PiP
            webView.addJavascriptInterface(new WidgetBridge(), "FluxGridWidget");
            webView.addJavascriptInterface(new NativeBridge(), "FluxGridNative");
        }
    }
    
    /**
     * JavaScript bridge for widget updates
     */
    public class WidgetBridge {
        @JavascriptInterface
        public void update() {
            runOnUiThread(() -> {
                StatsWidgetProvider.updateAllWidgets(MainActivity.this);
            });
        }
    }
    
    /**
     * JavaScript bridge for native features
     */
    public class NativeBridge {
        @JavascriptInterface
        public void updateDynamicShortcuts() {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N_MR1 && dynamicShortcutManager != null) {
                runOnUiThread(() -> {
                    dynamicShortcutManager.updateDynamicShortcuts();
                });
            }
        }
        
        @JavascriptInterface
        public void enterPictureInPicture() {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                runOnUiThread(() -> {
                    enterPipMode();
                });
            }
        }
    }
    
    /**
     * Enter Picture-in-Picture mode
     */
    private void enterPipMode() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                // Set aspect ratio for PiP window (1:1 for game)
                Rational aspectRatio = new Rational(1, 1);
                
                PictureInPictureParams params = new PictureInPictureParams.Builder()
                        .setAspectRatio(aspectRatio)
                        .build();
                
                enterPictureInPictureMode(params);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }
    
    @Override
    public void onPictureInPictureModeChanged(boolean isInPictureInPictureMode, Configuration newConfig) {
        super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig);
        isInPipMode = isInPictureInPictureMode;
        
        // Notify WebView about PiP mode change
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            String script = String.format("window.dispatchEvent(new CustomEvent('pipModeChanged', { detail: { isInPipMode: %b } }));", isInPictureInPictureMode);
            webView.evaluateJavascript(script, null);
        }
    }
    
    @Override
    public void onUserLeaveHint() {
        super.onUserLeaveHint();
        // Optionally auto-enter PiP when user presses home button
        // Uncomment to enable:
        // if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        //     enterPipMode();
        // }
    }
    
    /**
     * Create notification channels for Android 8.0+
     */
    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // Achievement notifications channel
            NotificationChannel achievementChannel = new NotificationChannel(
                "achievements",
                getString(R.string.notification_channel_achievements),
                NotificationManager.IMPORTANCE_DEFAULT
            );
            achievementChannel.setDescription(getString(R.string.notification_channel_achievements_desc));
            achievementChannel.enableVibration(true);
            achievementChannel.setShowBadge(true);
            
            // Daily reminder channel
            NotificationChannel dailyChannel = new NotificationChannel(
                "daily_reminders",
                getString(R.string.notification_channel_daily),
                NotificationManager.IMPORTANCE_LOW
            );
            dailyChannel.setDescription(getString(R.string.notification_channel_daily_desc));
            dailyChannel.enableVibration(false);
            dailyChannel.setShowBadge(false);
            
            // Register channels
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(achievementChannel);
                manager.createNotificationChannel(dailyChannel);
            }
        }
    }
    
    @Override
    public void onPause() {
        super.onPause();
        // Pause WebView when app goes to background
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.onPause();
            webView.pauseTimers();
        }
        
        // Update widgets when app goes to background
        StatsWidgetProvider.updateAllWidgets(this);
    }
    
    @Override
    public void onResume() {
        super.onResume();
        // Resume WebView when app comes to foreground
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.onResume();
            webView.resumeTimers();
        }
    }
    
    @Override
    public void onDestroy() {
        // Clean up WebView to prevent memory leaks
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.clearCache(true);
            webView.clearHistory();
        }
        super.onDestroy();
    }
}
