/**
 * Feature Unlock Hook
 * 
 * Hook for checking if features are unlocked
 */

import { useTutorialStore } from '../store/tutorialStore';
import { tooltipManager } from '../utils/TooltipManager';
import { useEffect } from 'react';

export const useFeatureUnlock = () => {
  const { shouldShowFeature, gamesCompleted } = useTutorialStore();
  
  // Show tooltips when features unlock
  useEffect(() => {
    // Combo timer unlocks at game 2
    if (gamesCompleted === 2 && shouldShowFeature('comboTimer')) {
      tooltipManager.show({
        id: 'combo-timer-unlock',
        message: 'Kombo zamanlayıcı açıldı! Komboları korumak için hızlı oynayın.',
        targetElement: '.combo-display',
        priority: 10,
        autoDismiss: true,
        dismissTimeout: 5000
      });
    }
    
    // Basic skills unlock at game 3
    if (gamesCompleted === 3 && shouldShowFeature('basicSkills')) {
      tooltipManager.show({
        id: 'basic-skills-unlock',
        message: 'Reroll yeteneği açıldı! Parçaları yeniden karıştırabilirsiniz.',
        targetElement: '.skills-panel',
        priority: 10,
        autoDismiss: true,
        dismissTimeout: 5000
      });
    }
    
    // All skills unlock at game 5
    if (gamesCompleted === 5 && shouldShowFeature('allSkills')) {
      tooltipManager.show({
        id: 'all-skills-unlock',
        message: 'Tüm yetenekler açıldı! Artık tüm özelliklere erişebilirsiniz.',
        targetElement: '.skills-panel',
        priority: 10,
        autoDismiss: true,
        dismissTimeout: 5000
      });
    }
  }, [gamesCompleted, shouldShowFeature]);
  
  return {
    shouldShowFeature,
    gamesCompleted
  };
};
