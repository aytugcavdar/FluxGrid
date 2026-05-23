package com.fluxgrid.app.widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;
import com.fluxgrid.app.MainActivity;
import com.fluxgrid.app.R;

/**
 * Stats Widget - Shows high scores and streak
 * 
 * Widget Data Contract:
 * - widget_high_score_endless: High score for endless mode (primary)
 * - widget_high_score_timed: High score for timed mode
 * - widget_daily_streak: Current daily streak
 * - widget_last_updated: Last update timestamp
 * 
 * Legacy keys (fallback for backward compatibility):
 * - flux_high_score_endless
 * - flux_high_score_timed
 * - flux_daily_streak
 */
public class StatsWidgetProvider extends AppWidgetProvider {
    
    // Capacitor Preferences uses this SharedPreferences name
    private static final String PREFS_NAME = "CapacitorStorage";
    
    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }
    
    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        // Get stats from Capacitor SharedPreferences
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        
        int endlessHighScore = getIntPreference(
            prefs,
            "widget_high_score_endless",
            "flux_high_score_endless"
        );
        int timedHighScore = getIntPreference(
            prefs,
            "widget_high_score_timed",
            "flux_high_score_timed"
        );
        int highScore = Math.max(endlessHighScore, timedHighScore);
        
        int streak = getIntPreference(
            prefs,
            "widget_daily_streak",
            "flux_daily_streak"
        );
        
        // Create RemoteViews
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_stats);
        
        // Set data
        views.setTextViewText(R.id.widget_high_score, formatScore(highScore));
        views.setTextViewText(R.id.widget_streak, String.valueOf(streak));
        
        // Create intent to launch app
        Intent intent = new Intent(context, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            context, 
            0, 
            intent, 
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_container, pendingIntent);
        
        // Update widget
        appWidgetManager.updateAppWidget(appWidgetId, views);
        
        // Log for debugging
        android.util.Log.d(
            "FluxGridWidget",
            "Updated widget - Score: " + highScore +
                ", Endless: " + endlessHighScore +
                ", Timed: " + timedHighScore +
                ", Streak: " + streak
        );
    }

    private static int getIntPreference(SharedPreferences prefs, String primaryKey, String legacyKey) {
        String value = prefs.getString(primaryKey, null);
        if (value == null) {
            value = prefs.getString(legacyKey, "0");
        }

        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return 0;
        }
    }
    
    private static String formatScore(int score) {
        if (score >= 1000000) {
            return String.format("%.1fM", score / 1000000.0);
        } else if (score >= 1000) {
            return String.format("%.1fK", score / 1000.0);
        }
        return String.valueOf(score);
    }
    
    /**
     * Update all widgets
     */
    public static void updateAllWidgets(Context context) {
        Intent intent = new Intent(context, StatsWidgetProvider.class);
        intent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
        
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        int[] ids = appWidgetManager.getAppWidgetIds(
            new android.content.ComponentName(context, StatsWidgetProvider.class)
        );
        
        if (ids.length > 0) {
            intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
            context.sendBroadcast(intent);
            android.util.Log.d("FluxGridWidget", "Triggered update for " + ids.length + " widgets");
        }
    }
}
