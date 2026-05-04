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
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.graphics.Color;
import com.getcapacitor.BridgeActivity;
import com.fluxgrid.app.widget.StatsWidgetProvider;
import com.google.firebase.crashlytics.FirebaseCrashlytics;
import android.app.ActivityManager;
import android.content.Context;

public class MainActivity extends BridgeActivity {
    
    private DynamicShortcutManager dynamicShortcutManager;
    private boolean isInPipMode = false;
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Enable immersive fullscreen mode
        enableImmersiveMode();
        
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
            
            // Advanced WebView optimizations for Skia rendering
            // Reduce overdraw and improve GPU performance
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
            
            // Optimize JavaScript execution
            settings.setJavaScriptCanOpenWindowsAutomatically(false);
            
            // Disable zoom controls (not needed for game)
            settings.setBuiltInZoomControls(false);
            settings.setDisplayZoomControls(false);
            settings.setSupportZoom(false);
            
            // Optimize media playback
            settings.setMediaPlaybackRequiresUserGesture(false);
            
            // Enable aggressive resource loading
            settings.setLoadsImagesAutomatically(true);
            settings.setBlockNetworkImage(false);
            settings.setBlockNetworkLoads(false);
            
            // Optimize text rendering
            settings.setTextZoom(100);
            
            // Force GPU rasterization for better Skia performance
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                settings.setOffscreenPreRaster(true);
            }
            
            // Add JavaScript interface for widget updates and PiP
            webView.addJavascriptInterface(new WidgetBridge(), "FluxGridWidget");
            webView.addJavascriptInterface(new NativeBridge(), "FluxGridNative");
        }
    }
    
    /**
     * Enable immersive fullscreen mode (hide status bar and navigation bar)
     */
    private void enableImmersiveMode() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            // Android 11+ (API 30+)
            getWindow().setDecorFitsSystemWindows(false);
            WindowInsetsController controller = getWindow().getInsetsController();
            if (controller != null) {
                controller.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                controller.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            // Android 10 and below
            getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            );
        }
        
        // Make status bar and navigation bar transparent
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarColor(Color.TRANSPARENT);
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
        
        /**
         * Get total device RAM in GB
         * Returns the actual total RAM, not the browser-limited value
         */
        @JavascriptInterface
        public int getTotalRAM() {
            try {
                ActivityManager activityManager = (ActivityManager) getSystemService(Context.ACTIVITY_SERVICE);
                if (activityManager != null) {
                    ActivityManager.MemoryInfo memoryInfo = new ActivityManager.MemoryInfo();
                    activityManager.getMemoryInfo(memoryInfo);
                    
                    // Convert bytes to GB (rounded)
                    long totalMemoryGB = memoryInfo.totalMem / (1024 * 1024 * 1024);
                    
                    // Return as int (GB)
                    return (int) totalMemoryGB;
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
            
            // Fallback: return 4GB if detection fails
            return 4;
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
        // Re-enable immersive mode when app comes back to foreground
        enableImmersiveMode();
        
        // Resume WebView when app comes to foreground
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.onResume();
            webView.resumeTimers();
        }
    }
    
    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            // Re-enable immersive mode when window regains focus
            enableImmersiveMode();
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
