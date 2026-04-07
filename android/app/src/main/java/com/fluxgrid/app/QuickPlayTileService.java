package com.fluxgrid.app;

import android.content.Intent;
import android.graphics.drawable.Icon;
import android.os.Build;
import android.service.quicksettings.Tile;
import android.service.quicksettings.TileService;
import androidx.annotation.RequiresApi;

/**
 * Quick Settings Tile for launching FluxGrid game
 * Appears in notification panel for quick access
 */
@RequiresApi(api = Build.VERSION_CODES.N)
public class QuickPlayTileService extends TileService {

    @Override
    public void onStartListening() {
        super.onStartListening();
        updateTile();
    }

    @Override
    public void onClick() {
        super.onClick();
        
        // Launch app with endless mode
        Intent intent = new Intent(this, MainActivity.class);
        intent.setAction(Intent.ACTION_VIEW);
        intent.setData(android.net.Uri.parse("fluxgrid://mode/endless"));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        
        startActivityAndCollapse(intent);
    }

    private void updateTile() {
        Tile tile = getQsTile();
        if (tile != null) {
            tile.setState(Tile.STATE_ACTIVE);
            tile.setLabel("FluxGrid");
            tile.setSubtitle("Hızlı Oyun");
            
            // Set icon
            Icon icon = Icon.createWithResource(this, R.drawable.ic_shortcut_endless);
            tile.setIcon(icon);
            
            tile.updateTile();
        }
    }
}
