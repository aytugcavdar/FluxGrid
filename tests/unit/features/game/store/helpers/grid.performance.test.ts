import { describe, it, expect } from 'vitest';
import { createEmptyGrid, processGrid } from '@features/game/store/helpers/grid';
import { GRID_SIZE, CellType } from '@features/game/types';

describe('Grid Processing Performance Tests', () => {
  it('LIGHTNING temizleme <100ms hedefini tutar', () => {
    const grid = createEmptyGrid();
    
    // LIGHTNING bloğu ve dolu satır/sütun oluştur
    grid[5][5] = { filled: true, color: '#fbbf24', id: 'lightning', type: CellType.LIGHTNING };
    for (let x = 0; x < GRID_SIZE; x++) {
      if (x !== 5) grid[5][x] = { filled: true, color: '#ff0000', id: `r5-${x}` };
    }
    for (let y = 0; y < GRID_SIZE; y++) {
      if (y !== 5) grid[y][5] = { filled: true, color: '#0000ff', id: `c5-${y}` };
    }
    
    const startTime = performance.now();
    processGrid(grid);
    const endTime = performance.now();
    
    const duration = endTime - startTime;
    expect(duration).toBeLessThan(100); // <100ms hedef
  });

  it('TARGET temizleme <50ms hedefini tutar', () => {
    const grid = createEmptyGrid();
    
    // TARGET bloğu ve 3x3 alan oluştur
    grid[5][5] = { filled: true, color: '#f97316', id: 'target', type: CellType.TARGET };
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = 5 + dx;
        const y = 5 + dy;
        if (x !== 5 || y !== 5) {
          grid[y][x] = { filled: true, color: '#ff0000', id: `cell-${y}-${x}` };
        }
      }
    }
    
    const startTime = performance.now();
    processGrid(grid);
    const endTime = performance.now();
    
    const duration = endTime - startTime;
    expect(duration).toBeLessThan(50); // <50ms hedef
  });

  it('DIAMOND hesaplama <10ms hedefini tutar', () => {
    const grid = createEmptyGrid();
    
    // DIAMOND içeren dolu satır oluştur
    for (let x = 0; x < GRID_SIZE; x++) {
      if (x === 5) {
        grid[9][x] = { filled: true, color: '#d946ef', id: 'diamond', type: CellType.DIAMOND };
      } else {
        grid[9][x] = { filled: true, color: '#ff0000', id: `r9-${x}` };
      }
    }
    
    const startTime = performance.now();
    const result = processGrid(grid);
    const endTime = performance.now();
    
    const duration = endTime - startTime;
    expect(duration).toBeLessThan(10); // <10ms hedef
    expect(result.diamondMultipliers.size).toBeGreaterThan(0);
  });

  it('Karmaşık grid işleme <150ms hedefini tutar', () => {
    const grid = createEmptyGrid();
    
    // Karmaşık senaryo: LIGHTNING + TARGET + DIAMOND + dolu satırlar
    grid[3][3] = { filled: true, color: '#fbbf24', id: 'lightning', type: CellType.LIGHTNING };
    grid[7][7] = { filled: true, color: '#f97316', id: 'target', type: CellType.TARGET };
    
    // Dolu satırlar
    for (let x = 0; x < GRID_SIZE; x++) {
      if (x !== 3) grid[3][x] = { filled: true, color: '#ff0000', id: `r3-${x}` };
      if (x !== 7) grid[7][x] = { filled: true, color: '#0000ff', id: `r7-${x}` };
      if (x === 5) {
        grid[9][x] = { filled: true, color: '#d946ef', id: 'diamond', type: CellType.DIAMOND };
      } else {
        grid[9][x] = { filled: true, color: '#00ff00', id: `r9-${x}` };
      }
    }
    
    const startTime = performance.now();
    processGrid(grid);
    const endTime = performance.now();
    
    const duration = endTime - startTime;
    expect(duration).toBeLessThan(150); // Karmaşık işlem için <150ms hedef
  });

  it('Boş grid işleme <5ms hedefini tutar', () => {
    const grid = createEmptyGrid();
    
    const startTime = performance.now();
    processGrid(grid);
    const endTime = performance.now();
    
    const duration = endTime - startTime;
    expect(duration).toBeLessThan(5); // Boş grid için <5ms hedef
  });
});
