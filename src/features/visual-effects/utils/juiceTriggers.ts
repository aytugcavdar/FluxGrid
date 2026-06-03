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
      addLineClearAnimation,
      addParticleExplosion,
      triggerComboGlow
    } = useJuiceStore.getState();
    
    // Skip all effects if performance mode is enabled
    if (performanceMode) {
      return;
    }
    
    // MINIMAL MODE: Only line animations at combo >= 5
    if (combo >= 5) {
      // Only add line clear animations (minimal cost)
      this.addLineClearAnimations(actions, addLineClearAnimation);
      return;
    }
    
    const lineCount = this.getClearedLineCount(actions);

    // SINGLE CLEAR: keep it clean. The 3D board sweep and haptic carry the feedback.
    if (lineCount <= 1) {
      this.addLineClearAnimations(actions, addLineClearAnimation);
      return;
    }

    // MULTI CLEAR: line animation plus one small extra layer.
    // 1. Line clear animations (always enabled)
    this.addLineClearAnimations(actions, addLineClearAnimation);
    
    // 2. Particle effects
    this.addParticleEffects(actions, addParticleExplosion);
    
    // 3. Combo glow
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
          
          const explosion = {
            x: centerX,
            y: centerY,
            color,
            intensity,
          };
          
          // Quantize particle emission to 16th note if AudioBPMManager is available
          if (this.audioBPMManager) {
            this.audioBPMManager.scheduleOnBeat(() => {
              addParticleExplosion(explosion);
            }, '16th');
          } else {
            // Fallback: immediate emission
            addParticleExplosion(explosion);
          }
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
    const { performanceMode, triggerPlacementFeedback } = useJuiceStore.getState();
    
    // Skip all effects if performance mode is enabled
    if (performanceMode) {
      return;
    }
    
    triggerPlacementFeedback('valid');
    
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
