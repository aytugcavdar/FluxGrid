import { v4 as uuidv4 } from 'uuid';
import type { GameStore } from '../gameStore';
import type { GridState, Piece, CellType } from '../../types';
import { GRID_SIZE } from '../../types';
import { processGrid } from './grid';

type GetFn = () => GameStore;
type SetFn = (partial: Partial<GameStore>) => void;

// Tier thresholds and events for Endless mode
const TIER_THRESHOLDS = [0, 2000, 5000, 10000, 20000];
const TIER_EVENTS = ['ICE_STORM', 'FOG', 'QUAKE', 'MIRROR'];

/**
 * Check if player has reached a new difficulty tier and activate corresponding event
 * Only applies to Endless mode
 */
export function checkTierEvent(
  score: number,
  currentTier: number,
  get: GetFn,
  set: SetFn
): void {
  const newTier = TIER_THRESHOLDS.filter(t => score >= t).length - 1;
  
  if (newTier > currentTier && newTier >= 1 && newTier <= 4) {
    const eventName = TIER_EVENTS[newTier - 1];
    
    const duration = eventName === 'MIRROR' ? 15
      : eventName === 'FOG' ? 5
      : eventName === 'QUAKE' ? 1
      : 5;  // ICE_STORM
    
    set({
      activeEvent: eventName as any,
      eventMovesRemaining: duration,
      difficultyTier: newTier
    });
    
    // QUAKE için anında uygula - temiz gravity-left algoritması
    if (eventName === 'QUAKE') {
      const quakeGrid = get().grid.map(row => row.map(cell => ({ ...cell })));
      
      // Her satır için ayrı ayrı işle
      for (let r = 0; r < GRID_SIZE; r++) {
        // 1. Sabit blokları (ICE/STONE) ve hareketli blokları ayır
        const fixedBlocks: Array<{ col: number; cell: any }> = [];
        const floatingBlocks: any[] = [];
        
        for (let c = 0; c < GRID_SIZE; c++) {
          const cell = quakeGrid[r][c];
          if (cell.filled) {
            if (cell.type === 'ICE' || cell.type === 'STONE') {
              fixedBlocks.push({ col: c, cell: { ...cell } });
            } else {
              floatingBlocks.push({ ...cell });
            }
          }
        }
        
        // 2. Satırı temizle
        for (let c = 0; c < GRID_SIZE; c++) {
          quakeGrid[r][c] = { filled: false, color: '' };
        }
        
        // 3. Sabit blokları orijinal pozisyonlarına yerleştir
        fixedBlocks.forEach(({ col, cell }) => {
          quakeGrid[r][col] = cell;
        });
        
        // 4. Hareketli blokları soldan başlayarak doldur (sabit pozisyonları atla)
        let writeIndex = 0;
        for (const block of floatingBlocks) {
          // Bir sonraki boş pozisyonu bul
          while (writeIndex < GRID_SIZE && quakeGrid[r][writeIndex].filled) {
            writeIndex++;
          }
          
          // Eğer grid'in sonuna geldiyse, blok düşer (kaybolur)
          if (writeIndex >= GRID_SIZE) break;
          
          quakeGrid[r][writeIndex] = block;
          writeIndex++;
        }
      }
      
      set({ grid: quakeGrid });
    }
  }
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
  
  // Sayacı azalt, olay bittiyse temizle
  const newRemaining = eventMovesRemaining - 1;
  if (newRemaining <= 0) {
    set({ activeEvent: null, eventMovesRemaining: 0 });
  } else {
    set({ eventMovesRemaining: newRemaining });
  }
}
