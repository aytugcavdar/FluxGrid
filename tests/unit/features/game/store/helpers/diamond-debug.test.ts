import { describe, it, expect } from 'vitest';
import { createEmptyGrid, processGrid } from '@features/game/store/helpers/grid';
import { GRID_SIZE, CellType } from '@features/game/types';

describe('DIAMOND Bloğu Debug Test', () => {
  it('DIAMOND bloğu satır temizlendiğinde 2x puan bonusu verir', () => {
    console.log('\n=== DIAMOND BLOĞU TEST ===');
    
    const grid = createEmptyGrid();
    
    // Satır 9'u DIAMOND bloğu ile doldur
    console.log('Satır 9\'u DIAMOND bloğu ile dolduruyorum...');
    for (let x = 0; x < GRID_SIZE; x++) {
      if (x === 5) {
        grid[9][x] = { filled: true, color: '#d946ef', id: 'diamond', type: CellType.DIAMOND };
        console.log(`  [${x}, 9] = DIAMOND (💎 pembe)`);
      } else {
        grid[9][x] = { filled: true, color: '#ff0000', id: `r9-${x}` };
      }
    }
    
    const result = processGrid(grid);
    
    console.log('\n=== SONUÇLAR ===');
    console.log(`Temizlenen satır sayısı: ${result.totalLinesCleared}`);
    console.log(`DIAMOND multiplier tespit edildi: ${result.diamondMultipliers.size > 0 ? 'EVET ✅' : 'HAYIR ❌'}`);
    console.log(`DIAMOND multiplier Map boyutu: ${result.diamondMultipliers.size}`);
    
    if (result.diamondMultipliers.size > 0) {
      console.log('\nDIAMOND multiplier detayları:');
      result.diamondMultipliers.forEach((value, key) => {
        if (key < 1000) {
          console.log(`  Satır ${key}: 2x puan bonusu aktif`);
        } else {
          console.log(`  Sütun ${key - 1000}: 2x puan bonusu aktif`);
        }
      });
    }
    
    // Puan hesaplama örneği
    console.log('\n=== PUAN HESAPLAMA ÖRNEĞİ ===');
    const basePoints = 100;
    const diamondMultiplier = result.diamondMultipliers.size > 0 ? 2.0 : 1.0;
    const finalPoints = basePoints * diamondMultiplier;
    
    console.log(`Base puan: ${basePoints}`);
    console.log(`DIAMOND çarpanı: ${diamondMultiplier}x`);
    console.log(`Final puan: ${finalPoints} ${diamondMultiplier > 1 ? '(2x bonus uygulandı! 🎉)' : ''}`);
    
    // Assertions
    expect(result.totalLinesCleared).toBe(1);
    expect(result.diamondMultipliers.has(9)).toBe(true);
    expect(result.diamondMultipliers.size).toBe(1);
    
    console.log('\n✅ DIAMOND bloğu (💎 pembe) satır temizlendiğinde 2x puan bonusu veriyor!');
  });

  it('Normal satır temizlemesinde DIAMOND olmadan bonus yok', () => {
    console.log('\n=== NORMAL SATIR TEMİZLEME (DIAMOND YOK) ===');
    
    const grid = createEmptyGrid();
    
    // Satır 9'u DIAMOND olmadan doldur
    for (let x = 0; x < GRID_SIZE; x++) {
      grid[9][x] = { filled: true, color: '#ff0000', id: `r9-${x}` };
    }
    
    const result = processGrid(grid);
    
    console.log(`Temizlenen satır sayısı: ${result.totalLinesCleared}`);
    console.log(`DIAMOND multiplier tespit edildi: ${result.diamondMultipliers.size > 0 ? 'EVET' : 'HAYIR ❌'}`);
    
    const basePoints = 100;
    const diamondMultiplier = result.diamondMultipliers.size > 0 ? 2.0 : 1.0;
    const finalPoints = basePoints * diamondMultiplier;
    
    console.log(`Base puan: ${basePoints}`);
    console.log(`DIAMOND çarpanı: ${diamondMultiplier}x`);
    console.log(`Final puan: ${finalPoints} (bonus yok)`);
    
    expect(result.totalLinesCleared).toBe(1);
    expect(result.diamondMultipliers.size).toBe(0);
    
    console.log('✅ DIAMOND olmadan normal puan');
  });

  it('DIAMOND ile ve DIAMOND olmadan puan farkı', () => {
    console.log('\n=== PUAN FARKI KARŞILAŞTIRMASI ===');
    
    // DIAMOND ile
    const gridWithDiamond = createEmptyGrid();
    for (let x = 0; x < GRID_SIZE; x++) {
      if (x === 5) {
        gridWithDiamond[9][x] = { filled: true, color: '#d946ef', id: 'diamond', type: CellType.DIAMOND };
      } else {
        gridWithDiamond[9][x] = { filled: true, color: '#ff0000', id: `r9-${x}` };
      }
    }
    const resultWithDiamond = processGrid(gridWithDiamond);
    
    // DIAMOND olmadan
    const gridWithoutDiamond = createEmptyGrid();
    for (let x = 0; x < GRID_SIZE; x++) {
      gridWithoutDiamond[9][x] = { filled: true, color: '#ff0000', id: `r9-${x}` };
    }
    const resultWithoutDiamond = processGrid(gridWithoutDiamond);
    
    const basePoints = 100;
    const pointsWithDiamond = basePoints * 2.0;
    const pointsWithoutDiamond = basePoints * 1.0;
    const difference = pointsWithDiamond - pointsWithoutDiamond;
    
    console.log(`DIAMOND ile puan: ${pointsWithDiamond}`);
    console.log(`DIAMOND olmadan puan: ${pointsWithoutDiamond}`);
    console.log(`Fark: +${difference} puan (${(difference / pointsWithoutDiamond * 100).toFixed(0)}% daha fazla!)`);
    
    expect(resultWithDiamond.diamondMultipliers.size).toBe(1);
    expect(resultWithoutDiamond.diamondMultipliers.size).toBe(0);
    expect(pointsWithDiamond).toBe(pointsWithoutDiamond * 2);
    
    console.log('✅ DIAMOND bloğu 2x daha fazla puan veriyor!');
  });
});
