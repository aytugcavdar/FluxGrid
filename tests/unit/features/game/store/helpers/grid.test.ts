import { describe, it, expect } from 'vitest';
import { createEmptyGrid, processGrid } from '@features/game/store/helpers/grid';
import { GRID_SIZE, CellType } from '@features/game/types';

describe('createEmptyGrid', () => {
  it('10x10 boş grid oluşturur', () => {
    const grid = createEmptyGrid();
    expect(grid).toHaveLength(GRID_SIZE);
    expect(grid[0]).toHaveLength(GRID_SIZE);
    grid.forEach(row => row.forEach(cell => expect(cell.filled).toBe(false)));
  });
});

describe('processGrid — satır/sütun temizleme', () => {
  it('dolu satırı temizler ve linesCleared döner', () => {
    const grid = createEmptyGrid();
    for (let x = 0; x < GRID_SIZE; x++) {
      grid[9][x] = { filled: true, color: '#ff0000', id: `r9-${x}` };
    }
    const result = processGrid(grid);
    expect(result.totalLinesCleared).toBe(1);
    expect(result.grid[9].every(c => !c.filled)).toBe(true);
  });

  it('dolu sütunu temizler', () => {
    const grid = createEmptyGrid();
    for (let y = 0; y < GRID_SIZE; y++) {
      grid[y][0] = { filled: true, color: '#00ff00', id: `c0-${y}` };
    }
    const result = processGrid(grid);
    expect(result.totalLinesCleared).toBe(1);
    expect(result.grid.every(row => !row[0].filled)).toBe(true);
  });

  it('tek renkli satır → colorBonus true', () => {
    const grid = createEmptyGrid();
    for (let x = 0; x < GRID_SIZE; x++) {
      grid[9][x] = { filled: true, color: '#ff0000', id: `r9-${x}` };
    }
    const result = processGrid(grid);
    expect(result.colorBonus).toBe(true);
  });

  it('karışık renkli satır → colorBonus false', () => {
    const grid = createEmptyGrid();
    for (let x = 0; x < GRID_SIZE; x++) {
      grid[9][x] = {
        filled: true,
        color: x % 2 === 0 ? '#ff0000' : '#00ff00',
        id: `r9-${x}`,
      };
    }
    const result = processGrid(grid);
    expect(result.colorBonus).toBe(false);
  });

  it('çoklu satır temizlemede linesCleared doğru sayılır', () => {
    const grid = createEmptyGrid();
    for (let x = 0; x < GRID_SIZE; x++) {
      grid[8][x] = { filled: true, color: '#ff0000', id: `r8-${x}` };
      grid[9][x] = { filled: true, color: '#0000ff', id: `r9-${x}` };
    }
    const result = processGrid(grid);
    expect(result.totalLinesCleared).toBe(2);
  });

  it('bomba bloğu 3x3 alanı patlatır', () => {
    const grid = createEmptyGrid();
    // Bomba merkezi (5,5)
    grid[5][5] = { filled: true, color: '#ff0000', id: 'bomb', type: CellType.BOMB };
    for (let x = 0; x < GRID_SIZE; x++) {
      if (x !== 5) grid[5][x] = { filled: true, color: '#ff0000', id: `r5-${x}` };
    }
    const result = processGrid(grid);
    expect(result.bombsExploded).toBeGreaterThan(0);
  });
});
