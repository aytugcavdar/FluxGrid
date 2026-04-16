import { useJuiceStore } from '../store/juiceStore';
import { ClearAction } from '../../game/store/helpers/grid';

/**
 * Trigger juice effects based on game actions
 */
export class JuiceTriggers {
  /**
   * Trigger effects when lines are cleared
   */
  static onLinesCleared(actions: ClearAction[], combo: number): void {
    const { 
      triggerScreenShake, 
      addLineClearAnimation, 
      addParticleExplosion,
      triggerComboGlow 
    } = useJuiceStore.getState();
    
    // Calculate intensity based on combo
    const intensity = Math.min(combo, 10) / 10;
    
    // Screen shake (stronger with higher combo)
    if (combo >= 2) {
      const shakeIntensity = 2 + (combo * 0.5);
      const shakeDuration = 150 + (combo * 20);
      triggerScreenShake(shakeIntensity, Math.min(shakeDuration, 400));
    }
    
    // Process each clear action
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
        
        // Add particle explosions for each cleared cell
        action.cells.forEach((cell) => {
          // Calculate screen position (approximate)
          const cellSize = 40; // Approximate cell size
          const gridOffsetX = window.innerWidth / 2 - (10 * cellSize) / 2;
          const gridOffsetY = window.innerHeight / 2 - (10 * cellSize) / 2;
          
          addParticleExplosion({
            x: gridOffsetX + cell.x * cellSize + cellSize / 2,
            y: gridOffsetY + cell.y * cellSize + cellSize / 2,
            color: cell.color,
            intensity: intensity,
          });
        });
      }
    });
    
    // Combo glow effect
    if (combo >= 3) {
      const glowColors = [
        '#3b82f6', // blue
        '#8b5cf6', // purple
        '#ec4899', // pink
        '#f59e0b', // amber
        '#10b981', // green
      ];
      const colorIndex = Math.min(combo - 3, glowColors.length - 1);
      triggerComboGlow(intensity, glowColors[colorIndex]);
    }
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
    const { triggerScreenShake, triggerPlacementFeedback } = useJuiceStore.getState();
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
    const { triggerPlacementFeedback } = useJuiceStore.getState();
    triggerPlacementFeedback('valid');
    
    // Subtle haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }
}
