/**
 * Quick Integration Example
 * 
 * How to quickly integrate 3D UI effects into Grid.tsx
 */

import { useEffect, useState } from 'react';
import * as BABYLON from 'babylonjs';
import { UI3DManager } from '../UI3DManager';

/**
 * Example: Add to Grid.tsx component
 */
export function Grid3DUIIntegration() {
  const [ui3dManager, setUi3dManager] = useState<UI3DManager | null>(null);
  
  // Initialize UI3D Manager when scene is ready
  useEffect(() => {
    // Assuming you have scene and engine from your existing code
    const scene = getYourBabylonScene(); // Your existing scene
    
    if (scene) {
      // Create UI3D Manager
      const manager = new UI3DManager(scene);
      
      // Initialize combo meter (top-right corner)
      manager.initializeComboMeter(new BABYLON.Vector3(8, 15, 0));
      
      setUi3dManager(manager);
      
      // Cleanup
      return () => {
        manager.dispose();
      };
    }
  }, []);
  
  // Update loop
  useEffect(() => {
    if (ui3dManager) {
      const scene = getYourBabylonScene();
      const engine = getYourBabylonEngine();
      
      const updateObserver = scene.onBeforeRenderObservable.add(() => {
        const deltaTime = engine.getDeltaTime();
        ui3dManager.update(deltaTime);
      });
      
      return () => {
        scene.onBeforeRenderObservable.remove(updateObserver);
      };
    }
  }, [ui3dManager]);
  
  // Example: Trigger effects on game events
  const handleLineClear = (lines: number, position: BABYLON.Vector3) => {
    if (!ui3dManager) return;
    
    // Show floating score
    const score = lines * 100;
    ui3dManager.showFloatingScore(score, position);
    
    // Update combo
    const newCombo = getCurrentCombo() + 1;
    ui3dManager.updateCombo(newCombo);
  };
  
  const handleLevelUp = (newLevel: number) => {
    if (!ui3dManager) return;
    
    // Show level up banner
    ui3dManager.showLevelUp(newLevel, new BABYLON.Vector3(5, 10, 0));
  };
  
  const handleAchievement = (title: string, icon: string) => {
    if (!ui3dManager) return;
    
    // Show achievement popup
    ui3dManager.showAchievement(title, icon, new BABYLON.Vector3(8, 12, 0));
  };
  
  // Return your existing Grid JSX
  return null;
}

/**
 * Example: Integration with JuiceTriggers
 */
export function integrateWithJuiceTriggers(ui3dManager: UI3DManager) {
  // In your existing juiceTriggers.ts file
  
  // On line clear
  function onLineClear(lines: number, position: BABYLON.Vector3, combo: number) {
    // Existing particle effects...
    
    // Add 3D UI effects
    const score = lines * 100;
    ui3dManager.showFloatingScore(score, position);
    ui3dManager.updateCombo(combo);
  }
  
  // On combo break
  function onComboBreak() {
    // Existing effects...
    
    // Reset combo meter
    ui3dManager.updateCombo(0);
  }
  
  // On perfect clear
  function onPerfectClear(position: BABYLON.Vector3) {
    // Existing effects...
    
    // Show big score
    ui3dManager.showFloatingScore(
      5000,
      position,
      new BABYLON.Color3(0, 1, 1) // Cyan
    );
    
    // Show achievement
    ui3dManager.showAchievement(
      'Perfect Clear!',
      '✨',
      new BABYLON.Vector3(8, 12, 0)
    );
  }
  
  // On level up
  function onLevelUp(newLevel: number) {
    // Existing effects...
    
    // Show banner
    ui3dManager.showLevelUp(newLevel, new BABYLON.Vector3(5, 10, 0));
  }
}

/**
 * Example: Combo-based score colors
 */
export function showComboScore(
  ui3dManager: UI3DManager,
  score: number,
  combo: number,
  position: BABYLON.Vector3
) {
  let color: BABYLON.Color3;
  
  if (combo < 3) {
    color = new BABYLON.Color3(1, 1, 0); // Yellow
  } else if (combo < 7) {
    color = new BABYLON.Color3(1, 0.5, 0); // Orange
  } else {
    color = new BABYLON.Color3(1, 0, 0); // Red
  }
  
  ui3dManager.showFloatingScore(score, position, color);
}

/**
 * Example: Achievement triggers
 */
export function checkAchievements(
  ui3dManager: UI3DManager,
  gameState: any
) {
  // First line clear
  if (gameState.totalLinesCleared === 1) {
    ui3dManager.showAchievement(
      'First Blood',
      '🎯',
      new BABYLON.Vector3(8, 12, 0)
    );
  }
  
  // Combo of 5
  if (gameState.combo === 5) {
    ui3dManager.showAchievement(
      'Combo Master',
      '🔥',
      new BABYLON.Vector3(8, 12, 0)
    );
  }
  
  // Combo of 10
  if (gameState.combo === 10) {
    ui3dManager.showAchievement(
      'Unstoppable!',
      '⚡',
      new BABYLON.Vector3(8, 12, 0)
    );
  }
  
  // Score milestone
  if (gameState.score >= 10000) {
    ui3dManager.showAchievement(
      'High Scorer',
      '💎',
      new BABYLON.Vector3(8, 12, 0)
    );
  }
}

// Helper functions (implement these based on your game state)
function getYourBabylonScene(): BABYLON.Scene {
  // Return your existing Babylon scene
  return null as any;
}

function getYourBabylonEngine(): BABYLON.Engine {
  // Return your existing Babylon engine
  return null as any;
}

function getCurrentCombo(): number {
  // Return current combo from game state
  return 0;
}
