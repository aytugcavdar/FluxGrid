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
 * Stats Widget - Shows daily high score and streak
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
        
        // Get high score (try endless mode first, fallback to 0)
        int highScore = 0;
        String highScoreStr = prefs.getString("flux_high_score_endless", "0");
        try {
            highScore = Integer.parseInt(highScoreStr);
        } catch (NumberFormatException e) {
            highScore = 0;
        }
        
        // Get streak
        int streak = 0;
        String streakStr = prefs.getString("flux_daily_streak", "0");
        try {
            streak = Integer.parseInt(streakStr);
        } catch (NumberFormatException e) {
            streak = 0;
        }
        
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
        android.util.Log.d("FluxGridWidget", "Updated widget - Score: " + highScore + ", Streak: " + streak);
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
