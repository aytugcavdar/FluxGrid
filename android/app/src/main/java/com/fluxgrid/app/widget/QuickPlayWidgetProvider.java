package com.fluxgrid.app.widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.widget.RemoteViews;
import com.fluxgrid.app.MainActivity;
import com.fluxgrid.app.R;

/**
 * Quick Play Widget - Quick access to game modes
 */
public class QuickPlayWidgetProvider extends AppWidgetProvider {
    
    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }
    
    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_quick_play);
        
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
        
        // Daily challenge button
        views.setOnClickPendingIntent(
            R.id.widget_btn_daily,
            createGameModePendingIntent(context, "daily", 3)
        );
        
        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
    
    private static PendingIntent createGameModePendingIntent(Context context, String mode, int requestCode) {
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setData(Uri.parse("fluxgrid://mode?mode=" + mode));
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
