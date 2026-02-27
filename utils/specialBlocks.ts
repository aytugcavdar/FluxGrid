import { GridState, SpecialBlockType, SpecialBlock, GRID_SIZE } from '../types';

export interface SpecialBlockResult {
  grid: GridState;
  bonusFlux: number;
  scoreMultiplier: number;
  additionalClears: Set<string>;
}

/**
 * Process special block effects during line clear
 */
export function processSpecialBlocks(
  grid: GridState,
  cellsToClear: Set<string>
): SpecialBlockResult {
  let bonusFlux = 0;
  let scoreMultiplier = 1.0;
  const additionalClears = new Set<string>();
  
  cellsToClear.forEach(key => {
    const [x, y] = key.split(',').map(Number);
    const cell = grid[y][x] as SpecialBlock;
    
    if (!cell.filled) return;
    
    const specialType = cell.specialType || SpecialBlockType.NORMAL;
    
    switch (specialType) {
      case SpecialBlockType.RAINBOW:
        // Clear all blocks of same color
        const targetColor = cell.color;
        for (let gy = 0; gy < GRID_SIZE; gy++) {
          for (let gx = 0; gx < GRID_SIZE; gx++) {
            if (grid[gy][gx].filled && grid[gy][gx].color === targetColor) {
              additionalClears.add(`${gx},${gy}`);
            }
          }
        }
        break;
        
      case SpecialBlockType.LOCK:
        // Decrement lock health, only clear if health reaches 0
        const lockCell = cell as SpecialBlock;
        if (lockCell.lockHealth && lockCell.lockHealth > 1) {
          lockCell.lockHealth--;
          cellsToClear.delete(key); // Don't clear yet
        }
        break;
        
      case SpecialBlockType.PORTAL:
        // Portal effect handled in game logic (teleport piece)
        break;
        
      case SpecialBlockType.MULTIPLIER:
        scoreMultiplier = Math.max(scoreMultiplier, 2.0);
        break;
        
      case SpecialBlockType.FLUX_GEN:
        bonusFlux += 10;
        break;
    }
  });
  
  return { grid, bonusFlux, scoreMultiplier, additionalClears };
}

/**
 * Create a special block with appropriate properties
 */
export function createSpecialBlock(
  type: SpecialBlockType,
  color: string,
  id?: string
): SpecialBlock {
  const baseCell: SpecialBlock = {
    filled: true,
    color,
    id,
    specialType: type
  };
  
  switch (type) {
    case SpecialBlockType.LOCK:
      baseCell.lockHealth = 3;
      break;
    case SpecialBlockType.ICE:
      baseCell.health = 2;
      break;
  }
  
  return baseCell;
}

/**
 * Get random special block type based on probabilities
 */
export function getRandomSpecialBlockType(): SpecialBlockType {
  const rand = Math.random();
  
  // Probabilities:
  // Normal: 70%
  // Ice: 10%
  // Bomb: 8%
  // Rainbow: 5%
  // Lock: 3%
  // Portal: 2%
  // Multiplier: 1.5%
  // Flux Gen: 0.5%
  
  if (rand < 0.70) return SpecialBlockType.NORMAL;
  if (rand < 0.80) return SpecialBlockType.ICE;
  if (rand < 0.88) return SpecialBlockType.BOMB;
  if (rand < 0.93) return SpecialBlockType.RAINBOW;
  if (rand < 0.96) return SpecialBlockType.LOCK;
  if (rand < 0.98) return SpecialBlockType.PORTAL;
  if (rand < 0.995) return SpecialBlockType.MULTIPLIER;
  return SpecialBlockType.FLUX_GEN;
}

/**
 * Get visual color for special block type
 */
export function getSpecialBlockColor(type: SpecialBlockType, baseColor: string): string {
  switch (type) {
    case SpecialBlockType.ICE:
      return '#a0d8f1'; // Light blue
    case SpecialBlockType.BOMB:
      return '#ff4444'; // Red
    case SpecialBlockType.RAINBOW:
      return '#ff00ff'; // Magenta
    case SpecialBlockType.LOCK:
      return '#888888'; // Gray
    case SpecialBlockType.PORTAL:
      return '#9b59b6'; // Purple
    case SpecialBlockType.MULTIPLIER:
      return '#f1c40f'; // Gold
    case SpecialBlockType.FLUX_GEN:
      return '#00ffff'; // Cyan
    default:
      return baseColor;
  }
}
