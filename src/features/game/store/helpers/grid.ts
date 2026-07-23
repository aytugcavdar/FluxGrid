/**
 * Grid manipulation utilities
 */
import { GridState, GRID_SIZE, GridCell, CellType } from '../../types';

// ClearAction interface for tracking cleared cells
export interface ClearAction {
  type: 'CELL_CLEAR';
  cells: Array<{
    x: number;
    y: number;
    id?: string;
    color: string;
    cellType?: CellType;
  }>;
  rows: number[];
  cols: number[];
  movedCells: Array<{
    id?: string;
    x: number;
    fromY: number;
    toY: number;
    cellType?: CellType;
  }>;
  lockedIceCells: Array<{
    id?: string;
    x: number;
    y: number;
    color: string;
    health?: number;
  }>;
  damagedIceCells: Array<{
    id?: string;
    x: number;
    y: number;
    color: string;
    health: number;
  }>;
  damagedFireCells: Array<{
    id?: string;
    x: number;
    y: number;
    color: string;
    health: number;
  }>;
  bombCells: Array<{
    id?: string;
    x: number;
    y: number;
    color: string;
  }>;
  chainIndex: number; // Which chain step this clear happened in
}

export interface ProcessGridOptions {
  applyGravity?: boolean;
}

/**
 * Create an empty grid
 */
export const createEmptyGrid = (): GridState => 
  Array(GRID_SIZE).fill(null).map(() => 
    Array(GRID_SIZE).fill(null).map(() => ({ filled: false, color: '' }))
  );

/**
 * Process grid for line clears, chain reactions, and special blocks
 */
export const processGrid = (initialGrid: GridState, options: ProcessGridOptions = {}): {
  grid: GridState;
  totalLinesCleared: number;
  chainCount: number;
  colorBonus: boolean;
  bombsExploded: number;
  iceBroken: number;
  actions: Array<{ type: string; [key: string]: any }>;
} => {
  const applyGravity = options.applyGravity ?? true;
  let currentGrid = initialGrid.map(row => row.map(cell => ({ ...cell })));
  let totalLinesCleared = 0;
  let linesClearedInPass = 0;
  let chainCount = 0;
  let colorBonus = false;
  let bombsExploded = 0;
  let iceBroken = 0;
  const actions: Array<{ type: string; [key: string]: any }> = [];

  // Process grid for line clears and chain reactions
  do {
    linesClearedInPass = 0;
    
    // 1. Check Rows
    const fullRows: number[] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      if (currentGrid[y].every(cell => cell.filled && cell.type !== CellType.VOID)) {
        fullRows.push(y);
      }
    }

    // 2. Check Cols
    const fullCols: number[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      let isFull = true;
      for (let y = 0; y < GRID_SIZE; y++) {
        if (!currentGrid[y][x].filled || currentGrid[y][x].type === CellType.VOID) {
          isFull = false;
          break;
        }
      }
      if (isFull) {
        fullCols.push(x);
      }
    }

    linesClearedInPass = fullRows.length + fullCols.length;
    totalLinesCleared += linesClearedInPass;

    if (linesClearedInPass > 0) {
      chainCount++;

      // Color Bonus Check
      const checkColorBonus = () => {
        for (const y of fullRows) {
          const rowColors = new Set(currentGrid[y].filter(c => c.filled).map(c => c.color));
          if (rowColors.size === 1) return true;
        }
        for (const x of fullCols) {
          const colColors = new Set<string>();
          for (let y = 0; y < GRID_SIZE; y++) {
            if (currentGrid[y][x].filled) colColors.add(currentGrid[y][x].color);
          }
          if (colColors.size === 1) return true;
        }
        return false;
      };
      if (checkColorBonus()) colorBonus = true;

      // Identify cells to clear
      const cellsHit = new Set<string>();
      fullRows.forEach(y => {
        for (let x = 0; x < GRID_SIZE; x++) cellsHit.add(`${x},${y}`);
      });
      fullCols.forEach(x => {
        for (let y = 0; y < GRID_SIZE; y++) cellsHit.add(`${x},${y}`);
      });

      const finalCellsToClear = new Set<string>();
      const processedBombs = new Set<string>();
      const explosionQueue: {x: number, y: number}[] = [];
      const damagedIceCells: ClearAction['damagedIceCells'] = [];
      const damagedFireCells: ClearAction['damagedFireCells'] = [];
      const bombCells: ClearAction['bombCells'] = [];

      const processHit = (x: number, y: number) => {
        const cell = currentGrid[y][x];
        if (!cell.filled) return;
        if (cell.type === CellType.VOID) return;

        if (cell.type === CellType.ICE && (cell.health || 0) > 1) {
          const nextHealth = (cell.health || 2) - 1;
          currentGrid[y][x] = { ...cell, health: nextHealth };
          damagedIceCells.push({
            id: cell.id,
            x,
            y,
            color: cell.color,
            health: nextHealth,
          });
        } else if (cell.type === CellType.FIRE && (cell.health || 0) > 1) {
          const nextHealth = (cell.health || 2) - 1;
          currentGrid[y][x] = { ...cell, health: nextHealth };
          damagedFireCells.push({
            id: cell.id,
            x,
            y,
            color: cell.color,
            health: nextHealth,
          });
        } else {
          const key = `${x},${y}`;
          if (!finalCellsToClear.has(key)) {
            finalCellsToClear.add(key);
            if (cell.type === CellType.ICE) {
              iceBroken++;
            }
            if (cell.type === CellType.BOMB) {
              explosionQueue.push({x, y});
              bombCells.push({ id: cell.id, x, y, color: cell.color });
              bombsExploded++;
            }
          }
        }
      };

      // Initial Hits
      cellsHit.forEach(key => {
        const [x, y] = key.split(',').map(Number);
        processHit(x, y);
      });

      // Process Explosions
      while (explosionQueue.length > 0) {
        const bomb = explosionQueue.pop()!;
        const bKey = `${bomb.x},${bomb.y}`;
        if (processedBombs.has(bKey)) continue;
        processedBombs.add(bKey);

        for(let dy = -1; dy <= 1; dy++) {
          for(let dx = -1; dx <= 1; dx++) {
            const nx = bomb.x + dx;
            const ny = bomb.y + dy;
            if(nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
              processHit(nx, ny);
            }
          }
        }
      }

      const movedCells: ClearAction['movedCells'] = [];
      const lockedIceCells: ClearAction['lockedIceCells'] = [];

      // Execute Clears
      const clearedCells: ClearAction['cells'] = [];
      
      finalCellsToClear.forEach(key => {
        const [x, y] = key.split(',').map(Number);
        const cell = currentGrid[y][x];
        
        // Track cleared cell for CELL_CLEAR event
        if (cell.filled) {
          clearedCells.push({
            x,
            y,
            id: cell.id,
            color: cell.color,
            cellType: cell.type
          });
        }
        
        currentGrid[y][x] = { filled: false, color: '' };
      });
      
      // Add CELL_CLEAR action for this chain step
      if (clearedCells.length > 0) {
        actions.push({
          type: 'CELL_CLEAR',
          cells: clearedCells,
          rows: [...fullRows],
          cols: [...fullCols],
          movedCells,
          lockedIceCells,
          damagedIceCells,
          damagedFireCells,
          bombCells,
          chainIndex: chainCount
        });
      }

      // T5+ Endless uses a fixed grid. Other modes keep the normal gravity rule.
      if (applyGravity) {
        for (let x = 0; x < GRID_SIZE; x++) {
          // ICE and VOID cells stay fixed while other blocks fall around them.
          const fixedPositions = new Map<number, GridCell>();
          for (let y = 0; y < GRID_SIZE; y++) {
            const cell = currentGrid[y][x];
            if (cell.filled && (cell.type === CellType.ICE || cell.type === CellType.VOID)) {
              fixedPositions.set(y, { ...cell });
            }
          }

          // Collect movable filled cells.
          const normalStack: Array<{ cell: GridCell; fromY: number }> = [];
          for (let y = 0; y < GRID_SIZE; y++) {
            const cell = currentGrid[y][x];
            if (cell.filled && cell.type !== CellType.ICE && cell.type !== CellType.VOID) {
              normalStack.push({ cell: { ...cell }, fromY: y });
            }
          }

          // Build result column: fixed cells stay in place, movable blocks fill from bottom.
          let normalIndex = normalStack.length - 1;
          for (let y = GRID_SIZE - 1; y >= 0; y--) {
            if (fixedPositions.has(y)) {
              currentGrid[y][x] = fixedPositions.get(y)!;
              const fixedCell = currentGrid[y][x];
              if (fixedCell.type === CellType.ICE) {
                lockedIceCells.push({
                  id: fixedCell.id,
                  x,
                  y,
                  color: fixedCell.color,
                  health: fixedCell.health,
                });
              }
            } else if (normalIndex >= 0) {
              // Fill with normal block from stack
              const entry = normalStack[normalIndex];
              currentGrid[y][x] = entry.cell;
              if (entry.fromY !== y) {
                movedCells.push({
                  id: entry.cell.id,
                  x,
                  fromY: entry.fromY,
                  toY: y,
                  cellType: entry.cell.type,
                });
              }
              normalIndex--;
            } else {
              // Empty cell
              currentGrid[y][x] = { filled: false, color: '' };
            }
          }
        }
      }
    }
  } while (linesClearedInPass > 0);

  return { grid: currentGrid, totalLinesCleared, chainCount, colorBonus, bombsExploded, iceBroken, actions };
};
