import { v4 as uuidv4 } from 'uuid';
import type { GameStore } from '../gameStore';
import type { GridState, Piece, CellType } from '../../types';
import { GRID_SIZE } from '../../types';
import { processGrid } from './grid';

type GetFn = () => GameStore;
type SetFn = (partial: Partial<GameStore>) => void;

// Tier thresholds and events for Endless mode
const TIER_THRESHOLDS = [0, 2000, 5000, 10000, 20000, 40000, 70000];
const TIER_EVENTS = ['ICE_STORM', 'GRAVITY_RUSH', 'QUAKE', 'MIRROR', 'CHAOS', 'VOID'];

// Return type for checkTierEvent
type TierEventResult = {
  difficultyTier: number;
  activeEvent: 'ICE_STORM' | 'GRAVITY_RUSH' | 'QUAKE' | 'MIRROR' | 'CHAOS' | 'VOID' | null;
  eventMovesRemaining: number;
  lastAction: any;
  grid?: GridState;
} | null;

/**
 * Check if player has reached a new difficulty tier and activate corresponding event
 * Only applies to Endless mode
 * Returns state updates instead of calling set() to avoid conflicts with tickActiveEvent
 */
export function checkTierEvent(
  score: number,
  currentTier: number,
  get: GetFn,
  set: SetFn
): TierEventResult {
  const newTier = TIER_THRESHOLDS.filter(t => score >= t).length - 1;
  
  if (newTier > currentTier && newTier >= 1 && newTier <= 6) {
    const eventName = TIER_EVENTS[newTier - 1];
    
    const duration = eventName === 'MIRROR' ? 15
      : eventName === 'GRAVITY_RUSH' ? 10
      : eventName === 'CHAOS' ? 999   // Süresiz (Tier 5 boyunca kalır)
      : eventName === 'VOID' ? 999    // Süresiz (Tier 6 boyunca kalır)
      : 5;
    
    const tierNames: Record<number, string> = {
      1: 'Gelişmiş',
      2: 'Uzman',
      3: 'Usta',
      4: 'Efsane',
      5: 'Kaos',
      6: 'Void',
    };
    
    const result: TierEventResult = {
      activeEvent: eventName as 'ICE_STORM' | 'GRAVITY_RUSH' | 'QUAKE' | 'MIRROR' | 'CHAOS' | 'VOID',
      eventMovesRemaining: duration,
      difficultyTier: newTier,
      lastAction: {
        type: 'MILESTONE',
        tier: newTier,
        tierName: tierNames[newTier] ?? `Tier ${newTier}`,
      },
    };
    
    // QUAKE için anında uygula - temiz gravity-left algoritması
    if (eventName === 'QUAKE') {
      const quakeGrid = get().grid.map(row => row.map(cell => ({ ...cell })));
      
      for (let r = 0; r < GRID_SIZE; r++) {
        // 1. ICE blokları orijinal pozisyonlarıyla kaydet
        const iceMap = new Map<number, any>();
        for (let c = 0; c < GRID_SIZE; c++) {
          const cell = quakeGrid[r][c];
          if (cell.filled && (cell.type === 'ICE' || cell.type === 'STONE')) {
            iceMap.set(c, { ...cell });
          }
        }
        
        // 2. Normal (hareketli) blokları topla
        const normalBlocks: any[] = [];
        for (let c = 0; c < GRID_SIZE; c++) {
          const cell = quakeGrid[r][c];
          if (cell.filled && cell.type !== 'ICE' && cell.type !== 'STONE') {
            normalBlocks.push({ ...cell });
          }
        }
        
        // 3. Satırı temizle
        for (let c = 0; c < GRID_SIZE; c++) {
          quakeGrid[r][c] = { filled: false, color: '' };
        }
        
        // 4. ICE blokları orijinal pozisyonlarına geri koy
        iceMap.forEach((cell, col) => {
          quakeGrid[r][col] = cell;
        });
        
        // 5. Normal blokları soldan başlayarak, ICE pozisyonlarını atlayarak doldur
        let writeCol = 0;
        for (const block of normalBlocks) {
          // ICE olan sütunları atla
          while (writeCol < GRID_SIZE && quakeGrid[r][writeCol].filled) {
            writeCol++;
          }
          if (writeCol >= GRID_SIZE) break;
          
          quakeGrid[r][writeCol] = block;
          writeCol++;
        }
      }
      
      result.grid = quakeGrid;
    }
    
    return result;
  }
  
  return null;
}

/**
 * Tick active event - apply event effects after piece placement
 * Handles ICE_STORM and MIRROR events
 */
export function tickActiveEvent(
  grid: GridState,
  piece: Piece,
  get: GetFn,
  set: SetFn
): void {
  const { activeEvent, eventMovesRemaining } = get();
  
  if (!activeEvent || eventMovesRemaining <= 0) return;
  
  if (activeEvent === 'GRAVITY_RUSH') {
    // Her 5 hamlede bir gravity yönünü değiştir
    const movesUsed = 10 - eventMovesRemaining; // 10 = GRAVITY_RUSH süresi
    if (movesUsed % 5 === 0 && movesUsed > 0) {
      const currentGrid = get().grid;
      const flippedGrid = currentGrid.map(row => row.map(c => ({ ...c })));
      
      // Sütun bazlı ters gravity (blocks fall from bottom upward)
      for (let x = 0; x < GRID_SIZE; x++) {
        const stack: any[] = [];
        for (let y = 0; y < GRID_SIZE; y++) {
          if (flippedGrid[y][x].filled) stack.push({ ...flippedGrid[y][x] });
        }
        
        for (let y = 0; y < GRID_SIZE; y++) {
          flippedGrid[y][x] = { filled: false, color: '' };
        }
        
        // Blocks collect at TOP instead of bottom (reverse gravity effect)
        stack.forEach((cell, i) => {
          flippedGrid[i][x] = cell;
        });
      }
      
      set({ grid: flippedGrid });
    }
  }
  
  if (activeEvent === 'QUAKE') {
    const currentGrid = get().grid;
    const quakeGrid = currentGrid.map(row => row.map(c => ({ ...c })));
    
    for (let r = 0; r < GRID_SIZE; r++) {
      const iceMap = new Map<number, any>();
      for (let c = 0; c < GRID_SIZE; c++) {
        const cell = quakeGrid[r][c];
        if (cell.filled && (cell.type === 'ICE' || cell.type === 'STONE')) {
          iceMap.set(c, { ...cell });
        }
      }
      
      const normalBlocks: any[] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        const cell = quakeGrid[r][c];
        if (cell.filled && cell.type !== 'ICE' && cell.type !== 'STONE') {
          normalBlocks.push({ ...cell });
        }
      }
      
      for (let c = 0; c < GRID_SIZE; c++) {
        quakeGrid[r][c] = { filled: false, color: '' };
      }
      
      iceMap.forEach((cell, col) => {
        quakeGrid[r][col] = cell;
      });
      
      let writeCol = 0;
      for (const block of normalBlocks) {
        while (writeCol < GRID_SIZE && quakeGrid[r][writeCol].filled) {
          writeCol++;
        }
        if (writeCol >= GRID_SIZE) break;
        quakeGrid[r][writeCol] = block;
        writeCol++;
      }
    }
    
    set({ grid: quakeGrid });
  }
  
  if (activeEvent === 'ICE_STORM') {
    // Rastgele boş bir hücreye buz bloğu ekle
    const emptyPositions: {x: number; y: number}[] = [];
    const currentGrid = get().grid;
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (!currentGrid[y][x].filled) emptyPositions.push({ x, y });
      }
    }
    if (emptyPositions.length > 0) {
      const pos = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
      const iceGrid = get().grid.map(row => row.map(c => ({ ...c })));
      iceGrid[pos.y][pos.x] = {
        filled: true,
        color: '#7dd3fc',
        id: uuidv4(),
        type: 'ICE' as any,
        health: 2,
      };
      set({ grid: iceGrid });
    }
  }
  
  if (activeEvent === 'MIRROR') {
    const mirrorShape = piece.shape.map((row: number[]) => [...row].reverse());
    const currentGrid = get().grid;
    
    // Tüm geçerli pozisyonları bul, en alttaki + en sağdaki tercih et
    let bestPos: { x: number; y: number } | null = null;
    let bestScore = -1;
    
    for (let y = 0; y <= GRID_SIZE - mirrorShape.length; y++) {
      for (let x = 0; x <= GRID_SIZE - mirrorShape[0].length; x++) {
        // Basit çakışma kontrolü — canPlacePiece yerine elle kontrol
        let fits = true;
        for (let dy = 0; dy < mirrorShape.length && fits; dy++) {
          for (let dx = 0; dx < mirrorShape[0].length && fits; dx++) {
            if (mirrorShape[dy][dx] === 1) {
              const gy = y + dy, gx = x + dx;
              if (gy >= GRID_SIZE || gx >= GRID_SIZE || currentGrid[gy][gx].filled) {
                fits = false;
              }
            }
          }
        }
        
        if (!fits) continue;
        
        // Skor: aşağı ve sağda olması tercih edilsin (oyuncunun yerleştirdiği yerin uzağı)
        const score = y * 10 + x;
        if (score > bestScore) {
          bestScore = score;
          bestPos = { x, y };
        }
      }
    }
    
    if (bestPos) {
      const mirrorGrid = currentGrid.map((row: any[]) => row.map((c: any) => ({ ...c })));
      mirrorShape.forEach((row: number[], dy: number) =>
        row.forEach((v: number, dx: number) => {
          if (v) {
            mirrorGrid[bestPos!.y + dy][bestPos!.x + dx] = {
              filled: true,
              color: piece.color,
              id: uuidv4(),
              type: 'NORMAL' as any,
            };
          }
        })
      );
      
      // processGrid çalıştır — satır temizleme olabilir
      const { grid: processedMirrorGrid } = processGrid(mirrorGrid);
      set({ grid: processedMirrorGrid });
    }
  }
  
  // CHAOS: her 5 hamlede rastgele bir event efekti tetikler
  if (activeEvent === 'CHAOS') {
    const movesInTier = 999 - eventMovesRemaining;
    if (movesInTier % 5 === 0 && movesInTier > 0) {
      const chaosEvents = ['ICE_STORM', 'GRAVITY_RUSH', 'MIRROR'] as const;
      const randomEvent = chaosEvents[Math.floor(Math.random() * chaosEvents.length)];
      
      // Geçici olarak o event'in single-move efektini çalıştır
      if (randomEvent === 'ICE_STORM') {
        const currentGrid = get().grid;
        const emptyPositions: {x: number; y: number}[] = [];
        for (let y = 0; y < GRID_SIZE; y++) {
          for (let x = 0; x < GRID_SIZE; x++) {
            if (!currentGrid[y][x].filled) emptyPositions.push({ x, y });
          }
        }
        if (emptyPositions.length > 0) {
          const pos = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
          const iceGrid = currentGrid.map(row => row.map(c => ({ ...c })));
          iceGrid[pos.y][pos.x] = {
            filled: true,
            color: '#7dd3fc',
            id: uuidv4(),
            type: 'ICE' as any,
            health: 2,
          };
          set({ grid: iceGrid });
        }
      } else if (randomEvent === 'GRAVITY_RUSH') {
        const currentGrid = get().grid;
        const flippedGrid = currentGrid.map(row => row.map(c => ({ ...c })));
        
        for (let x = 0; x < GRID_SIZE; x++) {
          const stack: any[] = [];
          for (let y = 0; y < GRID_SIZE; y++) {
            if (flippedGrid[y][x].filled) stack.push({ ...flippedGrid[y][x] });
          }
          
          for (let y = 0; y < GRID_SIZE; y++) {
            flippedGrid[y][x] = { filled: false, color: '' };
          }
          
          stack.forEach((cell, i) => {
            flippedGrid[i][x] = cell;
          });
        }
        
        set({ grid: flippedGrid });
      } else if (randomEvent === 'MIRROR') {
        const mirrorShape = piece.shape.map((row: number[]) => [...row].reverse());
        const currentGrid = get().grid;
        
        let bestPos: { x: number; y: number } | null = null;
        let bestScore = -1;
        
        for (let y = 0; y <= GRID_SIZE - mirrorShape.length; y++) {
          for (let x = 0; x <= GRID_SIZE - mirrorShape[0].length; x++) {
            let fits = true;
            for (let dy = 0; dy < mirrorShape.length && fits; dy++) {
              for (let dx = 0; dx < mirrorShape[0].length && fits; dx++) {
                if (mirrorShape[dy][dx] === 1) {
                  const gy = y + dy, gx = x + dx;
                  if (gy >= GRID_SIZE || gx >= GRID_SIZE || currentGrid[gy][gx].filled) {
                    fits = false;
                  }
                }
              }
            }
            
            if (!fits) continue;
            
            const score = y * 10 + x;
            if (score > bestScore) {
              bestScore = score;
              bestPos = { x, y };
            }
          }
        }
        
        if (bestPos) {
          const mirrorGrid = currentGrid.map((row: any[]) => row.map((c: any) => ({ ...c })));
          mirrorShape.forEach((row: number[], dy: number) =>
            row.forEach((v: number, dx: number) => {
              if (v) {
                mirrorGrid[bestPos!.y + dy][bestPos!.x + dx] = {
                  filled: true,
                  color: piece.color,
                  id: uuidv4(),
                  type: 'NORMAL' as any,
                };
              }
            })
          );
          
          const { grid: processedMirrorGrid } = processGrid(mirrorGrid);
          set({ grid: processedMirrorGrid });
        }
      }
    }
    return; // Sayaç azaltma — CHAOS için yapma, 999 kalacak
  }
  
  // VOID: her 10 hamlede üst 2 satırı siler
  if (activeEvent === 'VOID') {
    const movesInTier = 999 - eventMovesRemaining;
    if (movesInTier % 10 === 0 && movesInTier > 0) {
      const currentGrid = get().grid;
      const voidGrid = currentGrid.map(row => row.map(c => ({ ...c })));
      
      // İlk 2 satırı temizle
      for (let x = 0; x < GRID_SIZE; x++) {
        voidGrid[0][x] = { filled: false, color: '' };
        voidGrid[1][x] = { filled: false, color: '' };
      }
      
      set({ grid: voidGrid });
    }
    return; // Sayaç azaltma — VOID için yapma, 999 kalacak
  }
  
  // Sayacı azalt, olay bittiyse temizle
  const newRemaining = eventMovesRemaining - 1;
  if (newRemaining <= 0) {
    set({ activeEvent: null, eventMovesRemaining: 0 });
  } else {
    set({ eventMovesRemaining: newRemaining });
  }
}
