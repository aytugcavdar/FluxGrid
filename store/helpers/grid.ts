/**
 * Grid manipulation utilities
 */
import { GridState, GRID_SIZE, GridCell, CellType } from '../../types';

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
export const processGrid = (initialGrid: GridState): {
  grid: GridState;
  totalLinesCleared: number;
  chainCount: number;
  colorBonus: boolean;
  bombsExploded: number;
  iceBroken: number;
} => {
  let currentGrid = initialGrid.map(row => row.map(cell => ({ ...cell })));
  let totalLinesCleared = 0;
  let linesClearedInPass = 0;
  let chainCount = 0;
  let colorBonus = false;
  let bombsExploded = 0;
  let iceBroken = 0;

  do {
    linesClearedInPass = 0;
    
    // 1. Check Rows
    const fullRows: number[] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      if (currentGrid[y].every(cell => cell.filled)) fullRows.push(y);
    }

    // 2. Check Cols
    const fullCols: number[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      let isFull = true;
      for (let y = 0; y < GRID_SIZE; y++) {
        if (!currentGrid[y][x].filled) {
          isFull = false;
          break;
        }
      }
      if (isFull) fullCols.push(x);
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

      const processHit = (x: number, y: number) => {
        const cell = currentGrid[y][x];
        if (!cell.filled) return;

        if (cell.type === CellType.ICE && (cell.health || 0) > 1) {
          currentGrid[y][x] = { ...cell, health: (cell.health || 2) - 1 };
        } else {
          const key = `${x},${y}`;
          if (!finalCellsToClear.has(key)) {
            finalCellsToClear.add(key);
            if (cell.type === CellType.ICE) {
              iceBroken++;
            }
            if (cell.type === CellType.BOMB) {
              explosionQueue.push({x, y});
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

      // Execute Clears
      finalCellsToClear.forEach(key => {
        const [x, y] = key.split(',').map(Number);
        currentGrid[y][x] = { filled: false, color: '' };
      });

      // Apply Gravity
      for (let x = 0; x < GRID_SIZE; x++) {
        const stack: GridCell[] = [];
        for (let y = 0; y < GRID_SIZE; y++) {
          if (currentGrid[y][x].filled) stack.push(currentGrid[y][x]);
        }
        for (let y = GRID_SIZE - 1; y >= 0; y--) {
          const popped = stack.pop();
          if (popped) {
            currentGrid[y][x] = popped;
          } else {
            currentGrid[y][x] = { filled: false, color: '' };
          }
        }
      }
    }
  } while (linesClearedInPass > 0);

  return { grid: currentGrid, totalLinesCleared, chainCount, colorBonus, bombsExploded, iceBroken };
};
