package com.fluxgrid.app.widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.widget.RemoteViews;
import com.fluxgrid.app.MainActivity;
import com.fluxgrid.app.R;

/**
 * Quick Play Widget - Quick access to game modes
 * Supports: Endless and Timed modes only
 * Deep link format: fluxgrid://mode/{endless|timed}
 */
public class QuickPlayWidgetProvider extends AppWidgetProvider {

    private static final String PREFS_NAME = "CapacitorStorage";
    
    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }
    
    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_quick_play);
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        int bestScore = Math.max(
            getIntPreference(prefs, "widget_high_score_endless", "flux_high_score_endless"),
            getIntPreference(prefs, "widget_high_score_timed", "flux_high_score_timed")
        );
        boolean todayPlayed = Boolean.parseBoolean(prefs.getString("widget_today_played", "false"));

        views.setTextViewText(R.id.widget_quick_best_score, "En iyi " + formatScore(bestScore));
        views.setTextViewText(
            R.id.widget_quick_status,
            todayPlayed ? "Bugün oynandı" : "Bugün bekliyor"
        );
        
        // Endless mode button
        views.setOnClickPendingIntent(
            R.id.widget_btn_endless,
            createGameModePendingIntent(context, "endless", 1)
        );
        
        // Timed mode button
        views.setOnClickPendingIntent(
            R.id.widget_btn_timed,
            createGameModePendingIntent(context, "timed", 2)
        );
        
        appWidgetManager.updateAppWidget(appWidgetId, views);
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
    
    private static PendingIntent createGameModePendingIntent(Context context, String mode, int requestCode) {
        Intent intent = new Intent(Intent.ACTION_VIEW);
        // Use consistent deep link format: fluxgrid://mode/{mode}
        intent.setData(Uri.parse("fluxgrid://mode/" + mode));
        intent.setClass(context, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        
        return PendingIntent.getActivity(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }
}
