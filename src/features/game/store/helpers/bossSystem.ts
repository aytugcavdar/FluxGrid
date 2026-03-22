import { v4 as uuidv4 } from 'uuid';
import type { GameStore } from '../gameStore';
import type { Piece, GridState } from '../../types';
import { GRID_SIZE } from '../../types';

type GetFn = () => GameStore;
type SetFn = (partial: Partial<GameStore>) => void;

/**
 * Find a random empty cell in the grid
 */
export function findRandomEmptyCell(grid: GridState): { x: number; y: number } | null {
  const empty: { x: number; y: number }[] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (!grid[y][x].filled) empty.push({ x, y });
    }
  }
  if (empty.length === 0) return null;
  return empty[Math.floor(Math.random() * empty.length)];
}

/**
 * Apply boss mechanics after piece placement in Career mode
 * Handles ICE_STORM, BOMB_RAIN, FOG, and MIRROR boss types
 */
export function applyBossMechanics(
  justPlacedPiece: Piece,
  get: GetFn,
  set: SetFn
): void {
  const { bossType, bossMoveCounter } = get();
  
  if (!bossType) return;
  
  const newBossCounter = bossMoveCounter + 1;
  set({ bossMoveCounter: newBossCounter });
  
  switch (bossType) {
    case 'ICE_STORM':
      // Her 2 hamlede bir rastgele hücreye buz bloğu düşür
      if (newBossCounter % 2 === 0) {
        const empty = findRandomEmptyCell(get().grid);
        if (empty) {
          const updatedGrid = get().grid.map(row => row.map(cell => ({ ...cell })));
          updatedGrid[empty.y][empty.x] = {
            filled: true,
            color: '#7dd3fc',
            id: uuidv4(),
            type: 'ICE' as any,
            health: 2,
          };
          set({ grid: updatedGrid });
        }
      }
      break;
      
    case 'BOMB_RAIN':
      // Her 3 hamlede bir rastgele hücreye bomba düşür
      if (newBossCounter % 3 === 0) {
        const empty = findRandomEmptyCell(get().grid);
        if (empty) {
          const updatedGrid = get().grid.map(row => row.map(cell => ({ ...cell })));
          updatedGrid[empty.y][empty.x] = {
            filled: true,
            color: '#1c1917',
            id: uuidv4(),
            type: 'BOMB' as any,
          };
          set({ grid: updatedGrid });
        }
      }
      break;
      
    case 'FOG':
      // Parça renklerini gri yap (her hamlede)
      // Ama flux dolduğunda renkleri 1 saniye göster
      const { flux, isSurgeActive } = get();
      
      if (flux >= 100 || isSurgeActive) {
        // Flux dolu - renkleri göster (1 saniye sonra tekrar gizle)
        setTimeout(() => {
          if (get().bossType === 'FOG') {
            const darkPieces = get().pieces.map(p => ({
              ...p,
              color: '#374151', // koyu gri — renk bilinmiyor hissi
            }));
            set({ pieces: darkPieces });
          }
        }, 1000);
      } else {
        // Flux dolu değil - renkleri gizle
        const darkPieces = get().pieces.map(p => ({
          ...p,
          color: '#374151', // koyu gri — renk bilinmiyor hissi
        }));
        set({ pieces: darkPieces });
      }
      break;
      
    case 'MIRROR':
      // Her yerleştirmede aynı parçanın yatay mirror'ını rastgele boş bir pozisyona yerleştir
      if (!justPlacedPiece) break;
      
      const mirrorPiece = {
        ...justPlacedPiece,
        shape: justPlacedPiece.shape.map(row => [...row].reverse()), // Yatay mirror
        id: uuidv4(),
      };
      
      // Rastgele boş bir pozisyon bul
      const emptyPositions: { x: number; y: number }[] = [];
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          if (get().canPlacePiece(get().grid, mirrorPiece, x, y)) {
            emptyPositions.push({ x, y });
          }
        }
      }
      
      // Eğer geçerli pozisyon varsa, rastgele birini seç ve yerleştir
      if (emptyPositions.length > 0) {
        const randomPos = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
        const mirrorGrid = get().grid.map(row => row.map(cell => ({ ...cell })));
        
        // Mirror parçayı yerleştir
        mirrorPiece.shape.forEach((row, dy) => {
          row.forEach((cell, dx) => {
            if (cell) {
              const gridY = randomPos.y + dy;
              const gridX = randomPos.x + dx;
              if (gridY >= 0 && gridY < GRID_SIZE && gridX >= 0 && gridX < GRID_SIZE) {
                mirrorGrid[gridY][gridX] = {
                  filled: true,
                  color: mirrorPiece.color,
                  id: uuidv4(),
                  type: 'NORMAL' as any,
                };
              }
            }
          });
        });
        
        set({ grid: mirrorGrid });
      }
      break;
  }
}
