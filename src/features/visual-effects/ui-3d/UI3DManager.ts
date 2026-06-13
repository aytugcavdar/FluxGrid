/**
 * UI3D Manager
 * 
 * Main manager for all 3D UI effects.
 * Coordinates floating scores, combo meter, banners, and achievement popups.
 */

import * as BABYLON from 'babylonjs';
import { FloatingScoreManager } from './FloatingScoreManager';
import { ComboMeterManager } from './ComboMeterManager';
import { LevelUpBannerManager } from './LevelUpBannerManager';
import { AchievementPopupManager } from './AchievementPopupManager';

export class UI3DManager {
  private scene: BABYLON.Scene;
  private floatingScoreManager: FloatingScoreManager;
  private comboMeterManager: ComboMeterManager;
  private levelUpBannerManager: LevelUpBannerManager;
  private achievementPopupManager: AchievementPopupManager;
  
  constructor(scene: BABYLON.Scene) {
    this.scene = scene;
    
    // Initialize managers
    this.floatingScoreManager = new FloatingScoreManager(scene);
    this.comboMeterManager = new ComboMeterManager(scene);
    this.levelUpBannerManager = new LevelUpBannerManager(scene);
    this.achievementPopupManager = new AchievementPopupManager(scene);
  }
  
  /**
   * Initialize combo meter at position
   * @param position World position for combo meter
   */
  public initializeComboMeter(position: BABYLON.Vector3): void {
    this.comboMeterManager.initialize(position);
  }
  
  /**
   * Show floating score
   * @param score Score value
   * @param position World position
   * @param color Optional color (default: yellow)
   */
  public showFloatingScore(
    score: number,
    position: BABYLON.Vector3,
    color?: BABYLON.Color3
  ): void {
    this.floatingScoreManager.createFloatingScore(score, position, color);
  }
  
  /**
   * Update combo meter
   * @param combo Current combo count
   * @param maxCombo Maximum combo for scaling
   */
  public updateCombo(combo: number, maxCombo: number = 10): void {
    this.comboMeterManager.updateCombo(combo, maxCombo);
  }
  
  /**
   * Show level up banner
   * @param level New level number
   * @param position World position
   */
  public showLevelUp(level: number, position: BABYLON.Vector3): void {
    this.levelUpBannerManager.showLevelUp(level, position);
  }
  
  /**
   * Show achievement popup
   * @param title Achievement title
   * @param icon Icon character (emoji)
   * @param position World position
   */
  public showAchievement(
    title: string,
    icon: string,
    position: BABYLON.Vector3
  ): void {
    this.achievementPopupManager.showAchievement(title, icon, position);
  }
  
  /**
   * Update all UI elements
   * @param deltaTime Time since last frame (ms)
   */
  public update(deltaTime: number): void {
    this.floatingScoreManager.update(deltaTime);
    this.comboMeterManager.update(deltaTime);
    this.levelUpBannerManager.update(deltaTime);
    this.achievementPopupManager.update(deltaTime);
  }

  public hasActiveAnimations(): boolean {
    return this.floatingScoreManager.hasActiveAnimations()
      || this.comboMeterManager.hasActiveAnimations()
      || this.levelUpBannerManager.hasActiveAnimations()
      || this.achievementPopupManager.hasActiveAnimations();
  }
  
  /**
   * Dispose all UI elements
   */
  public dispose(): void {
    this.floatingScoreManager.dispose();
    this.comboMeterManager.dispose();
    this.levelUpBannerManager.dispose();
    this.achievementPopupManager.dispose();
  }
}
