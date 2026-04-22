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

  it('boş grid processGrid\'den geçince değişmez', () => {
    const grid = createEmptyGrid();
    const result = processGrid(grid);
    expect(result.totalLinesCleared).toBe(0);
    expect(result.chainCount).toBe(0);
    expect(result.colorBonus).toBe(false);
    result.grid.forEach(row => row.forEach(cell => expect(cell.filled).toBe(false)));
  });

  it('10x10 dolu grid tüm satır ve sütunları temizler', () => {
    const grid = createEmptyGrid();
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        grid[y][x] = { filled: true, color: '#ff0000', id: `${y}-${x}` };
      }
    }
    const result = processGrid(grid);
    expect(result.totalLinesCleared).toBeGreaterThanOrEqual(10);
    result.grid.forEach(row =>
      row.forEach(cell => expect(cell.filled).toBe(false))
    );
  });
});

describe('processGrid — LIGHTNING block clearing', () => {
  it('LIGHTNING bloğu tüm satırı temizler', () => {
    const grid = createEmptyGrid();
    // LIGHTNING bloğunu (5,5) konumuna yerleştir
    grid[5][5] = { filled: true, color: '#fbbf24', id: 'lightning', type: CellType.LIGHTNING };
    // Satırın geri kalanını doldur
    for (let x = 0; x < GRID_SIZE; x++) {
      if (x !== 5) grid[5][x] = { filled: true, color: '#ff0000', id: `r5-${x}` };
    }
    
    const result = processGrid(grid);
    
    // Tüm satır temizlenmeli
    expect(result.grid[5].every(c => !c.filled)).toBe(true);
    // LIGHTNING_CLEAR action oluşturulmalı
    expect(result.actions.some(a => a.type === 'LIGHTNING_CLEAR')).toBe(true);
  });

  it('LIGHTNING bloğu tüm sütunu temizler', () => {
    const grid = createEmptyGrid();
    // LIGHTNING bloğunu (5,5) konumuna yerleştir
    grid[5][5] = { filled: true, color: '#fbbf24', id: 'lightning', type: CellType.LIGHTNING };
    // Sütunun geri kalanını doldur
    for (let y = 0; y < GRID_SIZE; y++) {
      if (y !== 5) grid[y][5] = { filled: true, color: '#ff0000', id: `c5-${y}` };
    }
    
    const result = processGrid(grid);
    
    // Tüm sütun temizlenmeli
    expect(result.grid.every(row => !row[5].filled)).toBe(true);
    // LIGHTNING_CLEAR action oluşturulmalı
    expect(result.actions.some(a => a.type === 'LIGHTNING_CLEAR')).toBe(true);
  });

  it('LIGHTNING bloğu ICE bloklarının health değerini azaltır', () => {
    const grid = createEmptyGrid();
    // LIGHTNING bloğunu (5,5) konumuna yerleştir
    grid[5][5] = { filled: true, color: '#fbbf24', id: 'lightning', type: CellType.LIGHTNING };
    // ICE bloğu (health=2) aynı satıra yerleştir
    grid[5][3] = { filled: true, color: '#00ffff', id: 'ice', type: CellType.ICE, health: 2 };
    
    const result = processGrid(grid);
    
    // ICE bloğu temizlenmemeli, sadece health azalmalı
    expect(result.grid[5][3].filled).toBe(true);
    expect(result.grid[5][3].health).toBe(1);
  });

  it('LIGHTNING bloğu BOMB bloklarını patlatır', () => {
    const grid = createEmptyGrid();
    // LIGHTNING bloğunu (5,5) konumuna yerleştir
    grid[5][5] = { filled: true, color: '#fbbf24', id: 'lightning', type: CellType.LIGHTNING };
    // BOMB bloğu aynı satıra yerleştir
    grid[5][3] = { filled: true, color: '#ff0000', id: 'bomb', type: CellType.BOMB };
    // BOMB'un etrafına bloklar yerleştir
    grid[4][3] = { filled: true, color: '#ff0000', id: 'near-bomb' };
    grid[6][3] = { filled: true, color: '#ff0000', id: 'near-bomb2' };
    
    const result = processGrid(grid);
    
    // BOMB patlamalı
    expect(result.bombsExploded).toBeGreaterThan(0);
    // BOMB ve etrafındaki bloklar temizlenmeli
    expect(result.grid[5][3].filled).toBe(false);
  });
});

describe('processGrid — TARGET block clearing', () => {
  it('TARGET bloğu 3x3 alanı temizler', () => {
    const grid = createEmptyGrid();
    // TARGET bloğunu (5,5) konumuna yerleştir
    grid[5][5] = { filled: true, color: '#f97316', id: 'target', type: CellType.TARGET };
    // 3x3 alan doldur
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = 5 + dx;
        const y = 5 + dy;
        if (x !== 5 || y !== 5) {
          grid[y][x] = { filled: true, color: '#ff0000', id: `cell-${y}-${x}` };
        }
      }
    }
    
    const result = processGrid(grid);
    
    // 3x3 alan temizlenmeli
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        expect(result.grid[5 + dy][5 + dx].filled).toBe(false);
      }
    }
    // TARGET_CLEAR action oluşturulmalı
    expect(result.actions.some(a => a.type === 'TARGET_CLEAR')).toBe(true);
  });

  it('TARGET bloğu grid sınırlarına uyar', () => {
    const grid = createEmptyGrid();
    // TARGET bloğunu köşeye (0,0) yerleştir
    grid[0][0] = { filled: true, color: '#f97316', id: 'target', type: CellType.TARGET };
    // Etrafındaki geçerli hücreleri doldur
    grid[0][1] = { filled: true, color: '#ff0000', id: 'cell-0-1' };
    grid[1][0] = { filled: true, color: '#ff0000', id: 'cell-1-0' };
    grid[1][1] = { filled: true, color: '#ff0000', id: 'cell-1-1' };
    
    const result = processGrid(grid);
    
    // Sadece geçerli hücreler temizlenmeli (grid dışına çıkmamalı)
    expect(result.grid[0][0].filled).toBe(false);
    expect(result.grid[0][1].filled).toBe(false);
    expect(result.grid[1][0].filled).toBe(false);
    expect(result.grid[1][1].filled).toBe(false);
    // TARGET_CLEAR action oluşturulmalı
    expect(result.actions.some(a => a.type === 'TARGET_CLEAR')).toBe(true);
  });

  it('TARGET bloğu ICE bloklarının health değerini azaltır', () => {
    const grid = createEmptyGrid();
    // TARGET bloğunu (5,5) konumuna yerleştir
    grid[5][5] = { filled: true, color: '#f97316', id: 'target', type: CellType.TARGET };
    // ICE bloğu (health=2) 3x3 alan içine yerleştir
    grid[4][4] = { filled: true, color: '#00ffff', id: 'ice', type: CellType.ICE, health: 2 };
    
    const result = processGrid(grid);
    
    // ICE bloğu temizlenmemeli, sadece health azalmalı
    expect(result.grid[4][4].filled).toBe(true);
    expect(result.grid[4][4].health).toBe(1);
  });

  it('TARGET bloğu BOMB bloklarını patlatır', () => {
    const grid = createEmptyGrid();
    // TARGET bloğunu (5,5) konumuna yerleştir
    grid[5][5] = { filled: true, color: '#f97316', id: 'target', type: CellType.TARGET };
    // BOMB bloğu 3x3 alan içine yerleştir
    grid[4][4] = { filled: true, color: '#ff0000', id: 'bomb', type: CellType.BOMB };
    // BOMB'un etrafına bloklar yerleştir
    grid[3][4] = { filled: true, color: '#ff0000', id: 'near-bomb' };
    
    const result = processGrid(grid);
    
    // BOMB patlamalı
    expect(result.bombsExploded).toBeGreaterThan(0);
    // BOMB temizlenmeli
    expect(result.grid[4][4].filled).toBe(false);
  });
});

describe('processGrid — DIAMOND detection and tracking', () => {
  it('DIAMOND bloğu satır temizlemesinde tespit edilir', () => {
    const grid = createEmptyGrid();
    // Satırı DIAMOND bloğu ile doldur
    for (let x = 0; x < GRID_SIZE; x++) {
      if (x === 5) {
        grid[9][x] = { filled: true, color: '#d946ef', id: 'diamond', type: CellType.DIAMOND };
      } else {
        grid[9][x] = { filled: true, color: '#ff0000', id: `r9-${x}` };
      }
    }
    
    const result = processGrid(grid);
    
    // Satır temizlenmeli
    expect(result.totalLinesCleared).toBe(1);
    // DIAMOND multiplier tespit edilmeli (row 9)
    expect(result.diamondMultipliers.has(9)).toBe(true);
  });

  it('DIAMOND bloğu sütun temizlemesinde tespit edilir', () => {
    const grid = createEmptyGrid();
    // Sütunu DIAMOND bloğu ile doldur
    for (let y = 0; y < GRID_SIZE; y++) {
      if (y === 5) {
        grid[y][3] = { filled: true, color: '#d946ef', id: 'diamond', type: CellType.DIAMOND };
      } else {
        grid[y][3] = { filled: true, color: '#ff0000', id: `c3-${y}` };
      }
    }
    
    const result = processGrid(grid);
    
    // Sütun temizlenmeli
    expect(result.totalLinesCleared).toBe(1);
    // DIAMOND multiplier tespit edilmeli (column 3 with offset 1000)
    expect(result.diamondMultipliers.has(1003)).toBe(true);
  });

  it('birden fazla DIAMOND bloğu olan satırda tek multiplier kaydedilir', () => {
    const grid = createEmptyGrid();
    // Satırı birden fazla DIAMOND bloğu ile doldur
    for (let x = 0; x < GRID_SIZE; x++) {
      if (x === 3 || x === 7) {
        grid[9][x] = { filled: true, color: '#d946ef', id: `diamond-${x}`, type: CellType.DIAMOND };
      } else {
        grid[9][x] = { filled: true, color: '#ff0000', id: `r9-${x}` };
      }
    }
    
    const result = processGrid(grid);
    
    // Satır temizlenmeli
    expect(result.totalLinesCleared).toBe(1);
    // DIAMOND multiplier tespit edilmeli (sadece bir kez)
    expect(result.diamondMultipliers.has(9)).toBe(true);
    expect(result.diamondMultipliers.size).toBe(1);
  });

  it('DIAMOND bloğu LIGHTNING ile temizlendiğinde multiplier kaydedilmez', () => {
    const grid = createEmptyGrid();
    // LIGHTNING bloğunu (5,5) konumuna yerleştir
    grid[5][5] = { filled: true, color: '#fbbf24', id: 'lightning', type: CellType.LIGHTNING };
    // DIAMOND bloğu aynı satıra yerleştir
    grid[5][3] = { filled: true, color: '#d946ef', id: 'diamond', type: CellType.DIAMOND };
    // Satırın geri kalanını doldur
    for (let x = 0; x < GRID_SIZE; x++) {
      if (x !== 5 && x !== 3) {
        grid[5][x] = { filled: true, color: '#ff0000', id: `r5-${x}` };
      }
    }
    
    const result = processGrid(grid);
    
    // DIAMOND bloğu temizlenmeli
    expect(result.grid[5][3].filled).toBe(false);
    // Ancak multiplier kaydedilmemeli (LIGHTNING ile temizlendi)
    expect(result.diamondMultipliers.size).toBe(0);
  });

  it('DIAMOND bloğu TARGET ile temizlendiğinde multiplier kaydedilmez', () => {
    const grid = createEmptyGrid();
    // TARGET bloğunu (5,5) konumuna yerleştir
    grid[5][5] = { filled: true, color: '#f97316', id: 'target', type: CellType.TARGET };
    // DIAMOND bloğu 3x3 alan içine yerleştir
    grid[4][4] = { filled: true, color: '#d946ef', id: 'diamond', type: CellType.DIAMOND };
    
    const result = processGrid(grid);
    
    // DIAMOND bloğu temizlenmeli
    expect(result.grid[4][4].filled).toBe(false);
    // Ancak multiplier kaydedilmemeli (TARGET ile temizlendi)
    expect(result.diamondMultipliers.size).toBe(0);
  });

  it('DIAMOND bloğu BOMB patlamasıyla temizlendiğinde multiplier kaydedilmez', () => {
    const grid = createEmptyGrid();
    // Satırı BOMB bloğu ile doldur
    for (let x = 0; x < GRID_SIZE; x++) {
      if (x === 5) {
        grid[5][x] = { filled: true, color: '#ff0000', id: 'bomb', type: CellType.BOMB };
      } else {
        grid[5][x] = { filled: true, color: '#ff0000', id: `r5-${x}` };
      }
    }
    // DIAMOND bloğu BOMB'un yanına yerleştir (patlama alanında)
    grid[4][5] = { filled: true, color: '#d946ef', id: 'diamond', type: CellType.DIAMOND };
    
    const result = processGrid(grid);
    
    // BOMB patlamalı
    expect(result.bombsExploded).toBeGreaterThan(0);
    // DIAMOND bloğu temizlenmeli (BOMB patlamasıyla)
    expect(result.grid[4][5].filled).toBe(false);
    // Multiplier kaydedilmemeli (BOMB ile temizlendi)
    expect(result.diamondMultipliers.size).toBe(0);
  });

  it('çoklu satır temizlemesinde her DIAMOND içeren satır için multiplier kaydedilir', () => {
    const grid = createEmptyGrid();
    // İki satırı doldur, biri DIAMOND içersin diğeri içermesin
    for (let x = 0; x < GRID_SIZE; x++) {
      // Satır 8: DIAMOND içerir
      if (x === 5) {
        grid[8][x] = { filled: true, color: '#d946ef', id: 'diamond-8', type: CellType.DIAMOND };
      } else {
        grid[8][x] = { filled: true, color: '#ff0000', id: `r8-${x}` };
      }
      // Satır 9: DIAMOND içermez
      grid[9][x] = { filled: true, color: '#0000ff', id: `r9-${x}` };
    }
    
    const result = processGrid(grid);
    
    // İki satır temizlenmeli
    expect(result.totalLinesCleared).toBe(2);
    // Sadece satır 8 için multiplier kaydedilmeli
    expect(result.diamondMultipliers.has(8)).toBe(true);
    expect(result.diamondMultipliers.has(9)).toBe(false);
    expect(result.diamondMultipliers.size).toBe(1);
  });

  it('satır ve sütun aynı anda temizlendiğinde her ikisi için de DIAMOND tespit edilir', () => {
    const grid = createEmptyGrid();
    // Tüm grid'i doldur
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        grid[y][x] = { filled: true, color: '#ff0000', id: `${y}-${x}` };
      }
    }
    // Satır 5'e DIAMOND ekle
    grid[5][3] = { filled: true, color: '#d946ef', id: 'diamond-row', type: CellType.DIAMOND };
    // Sütun 7'ye DIAMOND ekle
    grid[2][7] = { filled: true, color: '#d946ef', id: 'diamond-col', type: CellType.DIAMOND };
    
    const result = processGrid(grid);
    
    // Tüm satır ve sütunlar temizlenmeli
    expect(result.totalLinesCleared).toBeGreaterThanOrEqual(10);
    // Her iki DIAMOND için de multiplier kaydedilmeli
    expect(result.diamondMultipliers.has(5)).toBe(true); // Row 5
    expect(result.diamondMultipliers.has(1007)).toBe(true); // Column 7 (with offset)
    expect(result.diamondMultipliers.size).toBeGreaterThanOrEqual(2);
  });
});

describe('processGrid — Chain reactions after LIGHTNING/TARGET clearing', () => {
  it('LIGHTNING temizlemesinden sonra yerçekimi uygulanır', () => {
    const grid = createEmptyGrid();
    
    // LIGHTNING bloğunu (5,5) konumuna yerleştir
    grid[5][5] = { filled: true, color: '#fbbf24', id: 'lightning', type: CellType.LIGHTNING };
    
    // Satır 5'i doldur
    for (let x = 0; x < GRID_SIZE; x++) {
      if (x !== 5) {
        grid[5][x] = { filled: true, color: '#ff0000', id: `r5-${x}` };
      }
    }
    
    // Sütun 5'i doldur
    for (let y = 0; y < GRID_SIZE; y++) {
      if (y !== 5) {
        grid[y][5] = { filled: true, color: '#0000ff', id: `c5-${y}` };
      }
    }
    
    // Satır 3'e bir blok ekle (sütun 5'te, LIGHTNING tarafından temizlenecek)
    // Satır 4'e bir blok ekle (sütun 3'te, yerçekimiyle aşağı düşecek)
    grid[4][3] = { filled: true, color: '#00ff00', id: 'falling-block' };
    
    const result = processGrid(grid);
    
    // LIGHTNING satır 5 ve sütun 5'i temizlemeli
    expect(result.actions.some(a => a.type === 'LIGHTNING_CLEAR')).toBe(true);
    
    // Yerçekimi uygulanmalı - satır 4'teki blok aşağı düşmeli
    // (Satır 4, sütun 3) → (Satır 9, sütun 3)
    expect(result.grid[9][3].filled).toBe(true);
    expect(result.grid[4][3].filled).toBe(false);
  });

  it('TARGET temizlemesinden sonra yerçekimi uygulanır ve chain reaction oluşabilir', () => {
    const grid = createEmptyGrid();
    
    // TARGET bloğunu (5,5) konumuna yerleştir
    grid[5][5] = { filled: true, color: '#f97316', id: 'target', type: CellType.TARGET };
    
    // 3x3 alanı doldur
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = 5 + dx;
        const y = 5 + dy;
        if (x !== 5 || y !== 5) {
          grid[y][x] = { filled: true, color: '#ff0000', id: `cell-${y}-${x}` };
        }
      }
    }
    
    // Satır 3'e bloklar ekle (TARGET'ın temizleyeceği sütunlarda)
    // Yerçekimiyle aşağı düşecekler
    grid[3][4] = { filled: true, color: '#00ff00', id: 'falling-1' };
    grid[3][5] = { filled: true, color: '#00ff00', id: 'falling-2' };
    grid[3][6] = { filled: true, color: '#00ff00', id: 'falling-3' };
    
    const result = processGrid(grid);
    
    // TARGET 3x3 alanı temizlemeli
    expect(result.actions.some(a => a.type === 'TARGET_CLEAR')).toBe(true);
    
    // Yerçekimi uygulanmalı - satır 3'teki bloklar aşağı düşmeli
    expect(result.grid[3][4].filled).toBe(false);
    expect(result.grid[3][5].filled).toBe(false);
    expect(result.grid[3][6].filled).toBe(false);
  });

  it('chain reaction içinde DIAMOND çarpanı sadece satır temizlemesinde uygulanır', () => {
    const grid = createEmptyGrid();
    
    // Satır 9'u DIAMOND ile doldur (normal line clear)
    for (let x = 0; x < GRID_SIZE; x++) {
      if (x === 5) {
        grid[9][x] = { filled: true, color: '#d946ef', id: 'diamond', type: CellType.DIAMOND };
      } else {
        grid[9][x] = { filled: true, color: '#ff0000', id: `r9-${x}` };
      }
    }
    
    const result = processGrid(grid);
    
    // Satır 9 temizlenmeli
    expect(result.totalLinesCleared).toBe(1);
    // DIAMOND multiplier kaydedilmeli (satır temizlemesi)
    expect(result.diamondMultipliers.has(9)).toBe(true);
  });

  it('LIGHTNING ile temizlenen DIAMOND bloğu multiplier vermez', () => {
    const grid = createEmptyGrid();
    
    // LIGHTNING bloğunu (5,5) konumuna yerleştir
    grid[5][5] = { filled: true, color: '#fbbf24', id: 'lightning', type: CellType.LIGHTNING };
    
    // Satır 5'e DIAMOND ekle (LIGHTNING ile temizlenecek)
    grid[5][3] = { filled: true, color: '#d946ef', id: 'diamond-lightning', type: CellType.DIAMOND };
    
    // Satır 5'in geri kalanını doldur
    for (let x = 0; x < GRID_SIZE; x++) {
      if (x !== 5 && x !== 3) {
        grid[5][x] = { filled: true, color: '#ff0000', id: `r5-${x}` };
      }
    }
    
    const result = processGrid(grid);
    
    // DIAMOND bloğu temizlenmeli
    expect(result.grid[5][3].filled).toBe(false);
    // Ancak multiplier kaydedilmemeli (LIGHTNING ile temizlendi)
    expect(result.diamondMultipliers.size).toBe(0);
  });

  it('birden fazla özel blok sırayla işlenir ve her biri chain reaction tetikleyebilir', () => {
    const grid = createEmptyGrid();
    
    // İki LIGHTNING bloğu farklı konumlara yerleştir
    grid[3][3] = { filled: true, color: '#fbbf24', id: 'lightning1', type: CellType.LIGHTNING };
    grid[7][7] = { filled: true, color: '#fbbf24', id: 'lightning2', type: CellType.LIGHTNING };
    
    // Her LIGHTNING'ın satırını doldur
    for (let x = 0; x < GRID_SIZE; x++) {
      if (x !== 3) grid[3][x] = { filled: true, color: '#ff0000', id: `r3-${x}` };
      if (x !== 7) grid[7][x] = { filled: true, color: '#0000ff', id: `r7-${x}` };
    }
    
    const result = processGrid(grid);
    
    // Her iki LIGHTNING da işlenmeli
    const lightningActions = result.actions.filter(a => a.type === 'LIGHTNING_CLEAR');
    expect(lightningActions.length).toBe(2);
    
    // Her iki satır da temizlenmeli
    expect(result.grid[3].every(c => !c.filled)).toBe(true);
    expect(result.grid[7].every(c => !c.filled)).toBe(true);
  });

  it('ICE blokları yerçekiminde yerinde kalır ve chain reaction\'ı engellemez', () => {
    const grid = createEmptyGrid();
    
    // LIGHTNING bloğunu (5,5) konumuna yerleştir
    grid[5][5] = { filled: true, color: '#fbbf24', id: 'lightning', type: CellType.LIGHTNING };
    
    // Satır 5'i doldur
    for (let x = 0; x < GRID_SIZE; x++) {
      if (x !== 5) {
        grid[5][x] = { filled: true, color: '#ff0000', id: `r5-${x}` };
      }
    }
    
    // Satır 4'e ICE bloğu ekle (yerçekiminde yerinde kalmalı)
    grid[4][5] = { filled: true, color: '#00ffff', id: 'ice', type: CellType.ICE, health: 2 };
    
    // Satır 3'ü doldur (yerçekiminden sonra aşağı düşecek ama ICE'ı geçemeyecek)
    for (let x = 0; x < GRID_SIZE; x++) {
      grid[3][x] = { filled: true, color: '#00ff00', id: `r3-${x}` };
    }
    
    const result = processGrid(grid);
    
    // LIGHTNING satır 5'i temizlemeli
    expect(result.grid[5].every(c => !c.filled)).toBe(true);
    
    // ICE bloğu yerinde kalmalı (satır 4, sütun 5)
    expect(result.grid[4][5].filled).toBe(true);
    expect(result.grid[4][5].type).toBe(CellType.ICE);
    
    // Satır 3 yerçekimiyle aşağı düşmeli ama ICE'ın üstünde kalmalı
    // (Satır 3 → Satır 6'ya düşer çünkü satır 4'te ICE var, satır 5 boş)
  });
});
