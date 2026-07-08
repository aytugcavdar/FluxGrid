package com.fluxgrid.app;

import android.content.Context;
import android.content.pm.ShortcutManager;
import android.os.Build;

import androidx.annotation.RequiresApi;

/**
 * Clears legacy dynamic shortcuts.
 *
 * Endless and Timed are already defined as static shortcuts in res/xml/shortcuts.xml.
 * Keeping dynamic copies for the same modes makes Android launchers show duplicates.
 */
@RequiresApi(api = Build.VERSION_CODES.N_MR1)
public class DynamicShortcutManager {

    private final ShortcutManager shortcutManager;

    public DynamicShortcutManager(Context context) {
        this.shortcutManager = context.getSystemService(ShortcutManager.class);
    }

    public void updateDynamicShortcuts() {
        clearDynamicShortcuts();
    }

    public void clearDynamicShortcuts() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N_MR1 || shortcutManager == null) {
            return;
        }

        try {
            shortcutManager.removeAllDynamicShortcuts();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
