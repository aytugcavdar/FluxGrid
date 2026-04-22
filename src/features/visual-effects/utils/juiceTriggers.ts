import { useJuiceStore } from '../store/juiceStore';
import { ClearAction } from '../../game/store/helpers/grid';

/**
 * Trigger juice effects based on game actions
 */
export class JuiceTriggers {
  /**
   * Trigger effects when lines are cleared
   * 
   * Performance scaling based on combo:
   * - Combo < 5: All effects (particles, screen shake, glow, line animations)
   * - Combo 5-9: Minimal effects (line animations only)
   * - Combo >= 10: No effects (prevents freeze)
   */
  static onLinesCleared(actions: ClearAction[], combo: number): void {
    const { 
      performanceMode,
      triggerScreenShake, 
      addLineClearAnimation,
      addParticleExplosion,
      triggerComboGlow
    } = useJuiceStore.getState();
    
    // Skip all effects if performance mode is enabled
    if (performanceMode) {
      return;
    }
    
    // PERFORMANCE MODE: Disable all effects at combo >= 10
    if (combo >= 10) {
      return; // Skip ALL effects at 10x+ combo to prevent freeze
    }
    
    // MINIMAL MODE: Only line animations at combo 5-9
    if (combo >= 5) {
      // Only add line clear animations (minimal cost)
      this.addLineClearAnimations(actions, addLineClearAnimation);
      return;
    }
    
    // FULL MODE: All effects at combo < 5
    // 1. Line clear animations (always enabled)
    this.addLineClearAnimations(actions, addLineClearAnimation);
    
    // 2. Particle effects
    this.addParticleEffects(actions, addParticleExplosion);
    
    // 3. Screen shake
    if (combo >= 2) {
      const shakeIntensity = Math.min(2 + combo * 0.5, 5);
      const shakeDuration = 100;
      triggerScreenShake(shakeIntensity, shakeDuration);
    }
    
    // 4. Combo glow
    if (combo >= 3) {
      const glowIntensity = Math.min(combo * 0.2, 1);
      const glowColor = this.getComboColor(combo);
      triggerComboGlow(glowIntensity, glowColor);
    }
  }
  
  /**
   * Add line clear animations for cleared rows/columns
   */
  private static addLineClearAnimations(
    actions: ClearAction[], 
    addLineClearAnimation: (animation: any) => void
  ): void {
    actions.forEach((action) => {
      if (action.type === 'CELL_CLEAR') {
        // Group cells by row/column
        const rowGroups = new Map<number, typeof action.cells>();
        const colGroups = new Map<number, typeof action.cells>();
        
        action.cells.forEach((cell) => {
          // Check if this cell is part of a full row
          const rowCells = action.cells.filter(c => c.y === cell.y);
          if (rowCells.length >= 10) {
            if (!rowGroups.has(cell.y)) {
              rowGroups.set(cell.y, rowCells);
            }
          }
          
          // Check if this cell is part of a full column
          const colCells = action.cells.filter(c => c.x === cell.x);
          if (colCells.length >= 10) {
            if (!colGroups.has(cell.x)) {
              colGroups.set(cell.x, colCells);
            }
          }
        });
        
        // Add line clear animations for rows
        rowGroups.forEach((cells, rowIndex) => {
          const avgColor = cells[0]?.color || '#ffffff';
          addLineClearAnimation({
            type: 'row',
            index: rowIndex,
            color: avgColor,
            chainIndex: action.chainIndex,
          });
        });
        
        // Add line clear animations for columns
        colGroups.forEach((cells, colIndex) => {
          const avgColor = cells[0]?.color || '#ffffff';
          addLineClearAnimation({
            type: 'column',
            index: colIndex,
            color: avgColor,
            chainIndex: action.chainIndex,
          });
        });
      }
    });
  }
  
  /**
   * Add particle explosion effects for cleared cells
   */
  private static addParticleEffects(
    actions: ClearAction[],
    addParticleExplosion: (explosion: any) => void
  ): void {
    actions.forEach((action) => {
      if (action.type === 'CELL_CLEAR') {
        // Add particle explosion at the center of cleared cells
        const cells = action.cells;
        if (cells.length > 0) {
          const centerX = cells.reduce((sum, cell) => sum + cell.x, 0) / cells.length;
          const centerY = cells.reduce((sum, cell) => sum + cell.y, 0) / cells.length;
          const color = cells[0]?.color || '#ffffff';
          const intensity = Math.min(cells.length * 0.1, 1);
          
          addParticleExplosion({
            x: centerX,
            y: centerY,
            color,
            intensity,
          });
        }
      }
    });
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
    const { performanceMode, triggerScreenShake, triggerPlacementFeedback } = useJuiceStore.getState();
    
    // Skip all effects if performance mode is enabled
    if (performanceMode) {
      return;
    }
    
    triggerScreenShake(3, 100);
    triggerPlacementFeedback('invalid');
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 30, 50]); // Double vibration pattern
    }
  }
  
  /**
   * Trigger effects for valid placement
   */
  static onValidPlacement(): void {
    const { performanceMode, triggerPlacementFeedback } = useJuiceStore.getState();
    
    // Skip all effects if performance mode is enabled
    if (performanceMode) {
      return;
    }
    
    triggerPlacementFeedback('valid');
    
    // Subtle haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }
}
