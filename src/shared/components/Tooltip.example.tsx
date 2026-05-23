/**
 * Tooltip Component - Usage Examples
 * 
 * This file demonstrates various ways to use the Tooltip component
 * for contextual help and feature discovery.
 */

import React from 'react';
import { Tooltip, useTooltipStore, TooltipAPI } from './Tooltip';
import { useAbilityStore } from '../../features/abilities/store/abilityStore';
import { ActiveAbilityType } from '../../features/abilities/types';

// ============================================================================
// EXAMPLE 1: Basic Tooltip on Button Click
// ============================================================================

export function BasicTooltipExample() {
  const { showTooltip, hasShownTooltip } = useTooltipStore();
  
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!hasShownTooltip('basic_example')) {
      const rect = event.currentTarget.getBoundingClientRect();
      showTooltip({
        id: 'basic_example',
        title: 'Welcome!',
        description: 'This is a basic tooltip example',
        position: {
          x: rect.left + rect.width / 2,
          y: rect.top,
          placement: 'top',
        },
        duration: 3000,
        icon: '👋',
      });
    }
  };
  
  return (
    <div>
      <button onClick={handleClick}>Click Me</button>
      <Tooltip />
    </div>
  );
}

// ============================================================================
// EXAMPLE 2: Ability Tooltips
// ============================================================================

const ABILITY_TOOLTIPS: Record<ActiveAbilityType, { title: string; description: string; icon: string }> = {
  [ActiveAbilityType.ROTATE]: {
    title: 'Döndür',
    description: 'Mevcut parçayı 90 derece saat yönünde döndür',
    icon: '🔄',
  },
  [ActiveAbilityType.SWAP]: {
    title: 'Değiştir',
    description: 'Kuyruktaki iki parçayı yer değiştir',
    icon: '🔀',
  },
  [ActiveAbilityType.BOMB]: {
    title: 'Bomba',
    description: 'Izgarada 3x3 alanı temizle',
    icon: '💣',
  },
  [ActiveAbilityType.MAGNET]: {
    title: 'Mıknatıs',
    description: 'Parçayı otomatik olarak en iyi konuma yerleştir',
    icon: '🧲',
  },
  [ActiveAbilityType.FREEZE]: {
    title: 'Dondur',
    description: 'Sonraki 3 hamle için parçaları dondur',
    icon: '❄️',
  },
  [ActiveAbilityType.UNDO]: {
    title: 'Geri Al',
    description: 'Son hamleyi geri al',
    icon: '↩️',
  },
  [ActiveAbilityType.SHATTER]: {
    title: 'Parçala',
    description: 'Mevcut parçayı parçala ve yenisini al',
    icon: '💥',
  },
  [ActiveAbilityType.REROLL]: {
    title: 'Yenile',
    description: 'Tüm parçaları yenile',
    icon: '🎲',
  },
};

export function AbilityTooltipExample({ abilityType }: { abilityType: ActiveAbilityType }) {
  const { showTooltip, hasShownTooltip } = useTooltipStore();
  const { activateAbility } = useAbilityStore();
  
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const tooltipId = `ability_${abilityType}`;
    
    // Show tooltip on first use
    if (!hasShownTooltip(tooltipId)) {
      const rect = event.currentTarget.getBoundingClientRect();
      const tooltipData = ABILITY_TOOLTIPS[abilityType];
      
      showTooltip({
        id: tooltipId,
        title: tooltipData.title,
        description: tooltipData.description,
        position: {
          x: rect.left + rect.width / 2,
          y: rect.top,
          placement: 'top',
        },
        duration: 5000,
        icon: tooltipData.icon,
      });
    }
    
    // Activate ability
    activateAbility(abilityType);
  };
  
  return (
    <button onClick={handleClick}>
      {ABILITY_TOOLTIPS[abilityType].icon}
    </button>
  );
}

// ============================================================================
// EXAMPLE 3: Settings Tooltip
// ============================================================================

export function SettingsTooltipExample() {
  const { showTooltip, hasShownTooltip } = useTooltipStore();
  
  const handleSettingsClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!hasShownTooltip('settings_first_access')) {
      const rect = event.currentTarget.getBoundingClientRect();
      showTooltip({
        id: 'settings_first_access',
        title: 'Ayarlar',
        description: 'Oyun deneyiminizi özelleştirin, dili değiştirin ve tercihleri yönetin',
        position: {
          x: rect.left + rect.width / 2,
          y: rect.bottom,
          placement: 'bottom',
        },
        duration: 4000,
        icon: '⚙️',
      });
    }
    
    // Open settings
    console.log('Opening settings...');
  };
  
  return <button onClick={handleSettingsClick}>⚙️ Ayarlar</button>;
}

// ============================================================================
// EXAMPLE 4: Feature Discovery Tooltip
// ============================================================================

export function FeatureDiscoveryExample() {
  const { showTooltip, hasShownTooltip } = useTooltipStore();
  
  React.useEffect(() => {
    if (!hasShownTooltip('feature_combo_timer')) {
      showTooltip({
        id: 'feature_combo_timer',
        title: 'Kombo Zamanlayici',
        description: 'Satir temizleyerek kombonu canli tut ve skorunu yukselt.',
        position: {
          x: window.innerWidth / 2,
          y: 100,
          placement: 'center',
        },
        duration: 5000,
        icon: '+',
      });
    }
  }, [hasShownTooltip, showTooltip]);
  
  return null;
}

// ============================================================================
// EXAMPLE 5: Programmatic API Usage
// ============================================================================

export function ProgrammaticAPIExample() {
  const showWelcomeTooltip = () => {
    TooltipAPI.show({
      id: 'welcome',
      title: 'Hoş Geldin!',
      description: 'FluxGrid\'e hoş geldin. Hadi başlayalım!',
      position: {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        placement: 'center',
      },
      duration: 3000,
      icon: '🎮',
    });
  };
  
  const hideTooltip = () => {
    TooltipAPI.hide();
  };
  
  const resetAllTooltips = () => {
    TooltipAPI.resetAll();
    console.log('All tooltips reset');
  };
  
  const checkTooltipStatus = () => {
    const hasShown = TooltipAPI.hasShown('welcome');
    console.log('Welcome tooltip shown:', hasShown);
  };
  
  return (
    <div style={{ display: 'flex', gap: '10px', padding: '20px' }}>
      <button onClick={showWelcomeTooltip}>Show Welcome</button>
      <button onClick={hideTooltip}>Hide Tooltip</button>
      <button onClick={resetAllTooltips}>Reset All</button>
      <button onClick={checkTooltipStatus}>Check Status</button>
    </div>
  );
}

// ============================================================================
// EXAMPLE 6: Multiple Placement Options
// ============================================================================

export function PlacementExample() {
  const { showTooltip } = useTooltipStore();
  
  const showTooltipAt = (placement: 'top' | 'bottom' | 'left' | 'right' | 'center') => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    showTooltip({
      id: `placement_${placement}`,
      title: `${placement.toUpperCase()} Placement`,
      description: `This tooltip is positioned ${placement}`,
      position: {
        x: centerX,
        y: centerY,
        placement,
      },
      duration: 3000,
      icon: '📍',
    });
  };
  
  return (
    <div style={{ display: 'flex', gap: '10px', padding: '20px' }}>
      <button onClick={() => showTooltipAt('top')}>Top</button>
      <button onClick={() => showTooltipAt('bottom')}>Bottom</button>
      <button onClick={() => showTooltipAt('left')}>Left</button>
      <button onClick={() => showTooltipAt('right')}>Right</button>
      <button onClick={() => showTooltipAt('center')}>Center</button>
    </div>
  );
}

// ============================================================================
// EXAMPLE 7: Auto-Dismiss vs Manual Dismiss
// ============================================================================

export function DismissExample() {
  const { showTooltip } = useTooltipStore();
  
  const showAutoDismiss = () => {
    showTooltip({
      id: 'auto_dismiss',
      title: 'Auto Dismiss',
      description: 'This tooltip will auto-dismiss after 3 seconds',
      position: {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        placement: 'center',
      },
      duration: 3000,
      icon: '⏱ï¸',
    });
  };
  
  const showManualDismiss = () => {
    showTooltip({
      id: 'manual_dismiss',
      title: 'Manual Dismiss',
      description: 'This tooltip requires manual dismissal (click X)',
      position: {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        placement: 'center',
      },
      // No duration - manual dismiss only
      icon: '👆',
    });
  };
  
  return (
    <div style={{ display: 'flex', gap: '10px', padding: '20px' }}>
      <button onClick={showAutoDismiss}>Auto Dismiss (3s)</button>
      <button onClick={showManualDismiss}>Manual Dismiss</button>
    </div>
  );
}

// ============================================================================
// EXAMPLE 8: Complete Integration in Game
// ============================================================================

export function GameIntegrationExample() {
  const { showTooltip, hasShownTooltip } = useTooltipStore();
  
  // Show tooltip when daily reward is available
  React.useEffect(() => {
    const checkDailyReward = () => {
      const isDailyRewardAvailable = true; // Example: get from store
      
      if (isDailyRewardAvailable && !hasShownTooltip('feature_daily_reward')) {
        showTooltip({
          id: 'feature_daily_reward',
          title: 'Günlük Ödül! 🎁',
          description: 'Günlük ödülünü almayı unutma!',
          position: {
            x: window.innerWidth - 100,
            y: 100,
            placement: 'left',
          },
          duration: 5000,
          icon: '🎁',
        });
      }
    };
    
    checkDailyReward();
  }, [hasShownTooltip, showTooltip]);
  
  // Show tooltip when streak is active
  const handleStreakClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!hasShownTooltip('feature_streak')) {
      const rect = event.currentTarget.getBoundingClientRect();
      showTooltip({
        id: 'feature_streak',
        title: 'Seri Devam Ediyor! 🔥',
        description: 'Her gün oynayarak serini koruyabilirsin',
        position: {
          x: rect.left + rect.width / 2,
          y: rect.bottom,
          placement: 'bottom',
        },
        duration: 4000,
        icon: '🔥',
      });
    }
  };
  
  return (
    <div>
      <button onClick={handleStreakClick}>🔥 Seri: 5 gün</button>
      <Tooltip />
    </div>
  );
}

// ============================================================================
// EXAMPLE 9: Testing Utilities
// ============================================================================

export function TestingUtilitiesExample() {
  return (
    <div style={{ padding: '20px' }}>
      <h3>Testing Utilities</h3>
      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
        <button onClick={() => TooltipAPI.resetAll()}>
          Reset All Tooltips
        </button>
        <button onClick={() => TooltipAPI.reset('ability_rotate')}>
          Reset Rotate Tooltip
        </button>
        <button onClick={() => {
          const hasShown = TooltipAPI.hasShown('ability_rotate');
          alert(`Rotate tooltip shown: ${hasShown}`);
        }}>
          Check Rotate Status
        </button>
        <button onClick={() => TooltipAPI.markAsShown('test_tooltip')}>
          Mark Test as Shown
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 10: Complete App Setup
// ============================================================================

export function CompleteAppExample() {
  return (
    <div>
      {/* Your app content */}
      <div style={{ padding: '20px' }}>
        <h1>FluxGrid</h1>
        <BasicTooltipExample />
        <SettingsTooltipExample />
        <ProgrammaticAPIExample />
      </div>
      
      {/* Tooltip manager - place at root level */}
      <Tooltip />
    </div>
  );
}

