import { useJuiceStore } from '../store/juiceStore';
import { ClearAction } from '../../game/store/helpers/grid';
import { gameFeelEvents } from '../../../utils/audio';

interface AudioBPMManager {
  update(deltaTime: number): void;
  scheduleOnBeat(callback: () => void, subdivision: '16th' | '8th' | 'quarter'): void;
}

/**
 * Trigger juice effects based on game actions
 */
export class JuiceTriggers {
  private static audioBPMManager: AudioBPMManager | null = null;
  
  /**
   * Initialize JuiceTriggers with AudioBPMManager
   * @param bpmManager AudioBPMManager instance
   */
  static initialize(bpmManager: AudioBPMManager): void {
    this.audioBPMManager = bpmManager;
  }
  
  /**
   * Update audio manager (called each frame)
   * @param deltaTime Time since last frame in milliseconds
   */
  static update(deltaTime: number): void {
    if (this.audioBPMManager) {
      this.audioBPMManager.update(deltaTime);
    }
  }
  /**
   * Trigger effects when lines are cleared
   * 
   * Performance scaling based on combo:
   * - Combo < 5: All effects (particles, screen shake, glow, line animations)
   * - Combo >= 5: Minimal effects (line animations only)
   * 
   * Note: SPS particle system now supports unlimited particles without performance degradation.
   * The combo >= 10 restriction has been removed after migrating to Solid Particle System.
   */
  static onLinesCleared(actions: ClearAction[], combo: number): void {
    const { 
      performanceMode,
      triggerComboGlow
    } = useJuiceStore.getState();
    
    // Skip all effects if performance mode is enabled
    if (performanceMode) {
      return;
    }
    
    const lineCount = this.getClearedLineCount(actions);

    // Legacy sweep and particle overlays are disabled after the 2D canvas
    // migration. Grid2D owns clear particles, block collapse and score chips.
    if (combo >= 3 && lineCount >= 3) {
      const glowIntensity = Math.min(combo * 0.2, 1);
      const glowColor = this.getComboColor(combo);
      triggerComboGlow(glowIntensity, glowColor);
    }
  }
  
  /**
   * Get combo color based on combo level
   */
  private static getComboColor(combo: number): string {
    if (combo >= 4) return '#ff00ff'; // Purple for high combo
    if (combo >= 3) return '#00ffff'; // Cyan for medium combo
    return '#ffff00'; // Yellow for low combo
  }
  
  /**
   * Trigger effects when combo breaks
   */
  static onComboBreak(): void {
    const { clearComboGlow } = useJuiceStore.getState();
    clearComboGlow();
  }
  
  /**
   * Trigger effects for invalid placement
   */
  static onInvalidPlacement(): void {
    const { performanceMode, triggerPlacementFeedback } = useJuiceStore.getState();
    
    // Skip all effects if performance mode is enabled
    if (performanceMode) {
      return;
    }
    
    triggerPlacementFeedback('invalid');
  }
  
  /**
   * Trigger effects for valid placement
   */
  static onValidPlacement(): void {
    const { performanceMode } = useJuiceStore.getState();
    
    // Skip all effects if performance mode is enabled
    if (performanceMode) {
      return;
    }
    
    gameFeelEvents.dragHover();
  }

  private static getClearedLineCount(actions: ClearAction[]): number {
    const rows = new Set<number>();
    const cols = new Set<number>();

    actions.forEach((action) => {
      if (action.type !== 'CELL_CLEAR') return;
      action.rows?.forEach(row => rows.add(row));
      action.cols?.forEach(col => cols.add(col));
    });

    return rows.size + cols.size;
  }
}
