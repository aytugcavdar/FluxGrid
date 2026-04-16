/**
 * Share Helper for Social Sharing
 * Uses Capacitor Share plugin for native sharing
 */

import { Capacitor } from '@capacitor/core';

// Lazy load Share plugin
let Share: any = null;

async function getShare() {
  if (!Share && Capacitor.isNativePlatform()) {
    try {
      const module = await import('@capacitor/share');
      Share = module.Share;
    } catch (error) {
      console.error('[Share] Failed to load Share plugin:', error);
    }
  }
  return Share;
}

/**
 * Check if sharing is supported
 */
export function isShareSupported(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Share score with text and optional image
 */
export async function shareScore(
  score: number,
  mode: string,
  combo?: number,
  imageUrl?: string
): Promise<boolean> {
  if (!isShareSupported()) {
    // Fallback to web share API
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'FluxGrid - Skorumu Paylaş',
          text: generateScoreText(score, mode, combo),
          url: 'https://fluxgrid.app',
        });
        return true;
      } catch (error) {
        console.error('[Share] Web share failed:', error);
        return false;
      }
    }
    return false;
  }
  
  try {
    const plugin = await getShare();
    if (!plugin) return false;
    
    const shareData: any = {
      title: 'FluxGrid - Skorumu Paylaş',
      text: generateScoreText(score, mode, combo),
      url: 'https://fluxgrid.app',
      dialogTitle: 'Skorunu Paylaş',
    };
    
    // Add image if provided
    if (imageUrl) {
      shareData.files = [imageUrl];
    }
    
    await plugin.share(shareData);
    console.log('[Share] Score shared successfully');
    return true;
  } catch (error) {
    console.error('[Share] Failed to share score:', error);
    return false;
  }
}

/**
 * Share achievement unlock
 */
export async function shareAchievement(
  achievementName: string,
  achievementDescription: string
): Promise<boolean> {
  if (!isShareSupported()) {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'FluxGrid - Başarım Açıldı!',
          text: `🏅 ${achievementName}\n${achievementDescription}\n\nFluxGrid'de oyna!`,
          url: 'https://fluxgrid.app',
        });
        return true;
      } catch (error) {
        return false;
      }
    }
    return false;
  }
  
  try {
    const plugin = await getShare();
    if (!plugin) return false;
    
    await plugin.share({
      title: 'FluxGrid - Başarım Açıldı!',
      text: `🏅 ${achievementName}\n${achievementDescription}\n\nFluxGrid'de oyna!`,
      url: 'https://fluxgrid.app',
      dialogTitle: 'Başarımı Paylaş',
    });
    
    return true;
  } catch (error) {
    console.error('[Share] Failed to share achievement:', error);
    return false;
  }
}

/**
 * Share combo milestone
 */
export async function shareCombo(combo: number): Promise<boolean> {
  const messages: Record<number, string> = {
    5: '🔥 5x Combo yaptım!',
    10: '⚡ 10x Combo! İnanılmaz!',
    15: '💥 15x Combo! Efsane!',
    20: '🌟 20x Combo! Tanrı modu!',
  };
  
  const message = messages[combo] || `🎯 ${combo}x Combo yaptım!`;
  
  if (!isShareSupported()) {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'FluxGrid - Combo Başarısı',
          text: `${message}\n\nFluxGrid'de oyna!`,
          url: 'https://fluxgrid.app',
        });
        return true;
      } catch (error) {
        return false;
      }
    }
    return false;
  }
  
  try {
    const plugin = await getShare();
    if (!plugin) return false;
    
    await plugin.share({
      title: 'FluxGrid - Combo Başarısı',
      text: `${message}\n\nFluxGrid'de oyna!`,
      url: 'https://fluxgrid.app',
      dialogTitle: 'Combo\'yu Paylaş',
    });
    
    return true;
  } catch (error) {
    console.error('[Share] Failed to share combo:', error);
    return false;
  }
}

/**
 * Share daily streak
 */
export async function shareStreak(streak: number): Promise<boolean> {
  if (!isShareSupported()) {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'FluxGrid - Günlük Seri',
          text: `🔥 ${streak} günlük seri! FluxGrid'de her gün oynuyorum!\n\nSen de katıl!`,
          url: 'https://fluxgrid.app',
        });
        return true;
      } catch (error) {
        return false;
      }
    }
    return false;
  }
  
  try {
    const plugin = await getShare();
    if (!plugin) return false;
    
    await plugin.share({
      title: 'FluxGrid - Günlük Seri',
      text: `🔥 ${streak} günlük seri! FluxGrid'de her gün oynuyorum!\n\nSen de katıl!`,
      url: 'https://fluxgrid.app',
      dialogTitle: 'Seriyi Paylaş',
    });
    
    return true;
  } catch (error) {
    console.error('[Share] Failed to share streak:', error);
    return false;
  }
}

/**
 * Generate score text for sharing
 */
function generateScoreText(score: number, mode: string, combo?: number): string {
  const modeNames: Record<string, string> = {
    'ENDLESS': 'Sonsuz',
    'TIMED': 'Zamanlı',
    'ZEN': 'Zen',
  };
  
  const modeName = modeNames[mode] || mode;
  const formattedScore = score.toLocaleString('tr-TR');
  
  let text = `🎮 FluxGrid ${modeName} modda ${formattedScore} puan yaptım!`;
  
  if (combo && combo >= 5) {
    text += `\n🔥 En yüksek combo: ${combo}x`;
  }
  
  text += '\n\nSen de oyna!';
  
  return text;
}

/**
 * Check if can share (for UI visibility)
 */
export async function canShare(): Promise<boolean> {
  if (isShareSupported()) {
    const plugin = await getShare();
    return plugin !== null;
  }
  return !!navigator.share;
}
