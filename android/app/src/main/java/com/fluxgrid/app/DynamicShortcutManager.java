package com.fluxgrid.app;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ShortcutInfo;
import android.content.pm.ShortcutManager;
import android.graphics.drawable.Icon;
import android.net.Uri;
import android.os.Build;
import androidx.annotation.RequiresApi;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

/**
 * Manages dynamic shortcuts based on recently played game modes
 */
@RequiresApi(api = Build.VERSION_CODES.N_MR1)
public class DynamicShortcutManager {
    
    private static final String PREFS_NAME = "CapacitorStorage";
    private static final String RECENT_MODES_KEY = "fluxgrid_recent_modes";
    private static final int MAX_SHORTCUTS = 3;
    
    private final Context context;
    private final ShortcutManager shortcutManager;
    
    public DynamicShortcutManager(Context context) {
        this.context = context;
        this.shortcutManager = context.getSystemService(ShortcutManager.class);
    }
    
    /**
     * Update dynamic shortcuts based on recently played modes
     */
    public void updateDynamicShortcuts() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N_MR1) {
            return;
        }
        
        try {
            List<RecentMode> recentModes = getRecentModes();
            List<ShortcutInfo> shortcuts = new ArrayList<>();
            
            for (int i = 0; i < Math.min(recentModes.size(), MAX_SHORTCUTS); i++) {
                RecentMode mode = recentModes.get(i);
                ShortcutInfo shortcut = createShortcut(mode, i);
                if (shortcut != null) {
                    shortcuts.add(shortcut);
                }
            }
            
            shortcutManager.setDynamicShortcuts(shortcuts);
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    /**
     * Create a shortcut for a game mode
     */
    private ShortcutInfo createShortcut(RecentMode mode, int rank) {
        String id = "recent_" + mode.mode.toLowerCase();
        String label = getModeLabel(mode.mode);
        String longLabel = getModeLabel(mode.mode) + " - " + formatScore(mode.highScore);
        int iconRes = getModeIcon(mode.mode);
        
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setClass(context, MainActivity.class);
        intent.setData(Uri.parse("fluxgrid://mode/" + mode.mode.toLowerCase()));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        
        return new ShortcutInfo.Builder(context, id)
                .setShortLabel(label)
                .setLongLabel(longLabel)
                .setIcon(Icon.createWithResource(context, iconRes))
                .setIntent(intent)
                .setRank(rank)
                .build();
    }
    
    /**
     * Get recently played modes from SharedPreferences
     */
    private List<RecentMode> getRecentModes() {
        List<RecentMode> modes = new ArrayList<>();
        
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String json = prefs.getString(RECENT_MODES_KEY, "[]");
            
            JSONArray array = new JSONArray(json);
            for (int i = 0; i < array.length(); i++) {
                JSONObject obj = array.getJSONObject(i);
                RecentMode mode = new RecentMode();
                mode.mode = obj.getString("mode");
                mode.lastPlayed = obj.getLong("lastPlayed");
                mode.highScore = obj.getInt("highScore");
                modes.add(mode);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        return modes;
    }
    
    /**
     * Get mode label
     */
    private String getModeLabel(String mode) {
        switch (mode) {
            case "ENDLESS":
                return "Sonsuz";
            case "TIMED":
                return "Zamanlı";
            case "ZEN":
                return "Zen";
            default:
                return mode;
        }
    }
    
    /**
     * Get mode icon resource
     */
    private int getModeIcon(String mode) {
        switch (mode) {
            case "ENDLESS":
                return R.drawable.ic_shortcut_endless;
            case "TIMED":
                return R.drawable.ic_shortcut_timed;
            case "ZEN":
                return R.drawable.ic_shortcut_zen;
            default:
                return R.drawable.ic_shortcut_endless;
        }
    }
    
    /**
     * Format score for display
     */
    private String formatScore(int score) {
        if (score >= 1000000) {
            return String.format("%.1fM", score / 1000000.0);
        } else if (score >= 1000) {
            return String.format("%.1fK", score / 1000.0);
        } else {
            return String.valueOf(score);
        }
    }
    
    /**
     * Recent mode data class
     */
    private static class RecentMode {
        String mode;
        long lastPlayed;
        int highScore;
    }
}
