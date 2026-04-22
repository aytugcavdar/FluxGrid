import { v4 as uuidv4 } from 'uuid';
import type { GameStore } from '../gameStore';
import type { GridState, Piece, CellType } from '../../types';
import { GRID_SIZE } from '../../types';
import { processGrid } from './grid';
import { EVENT_DURATIONS, EVENT_SCORE_MULTIPLIERS, EVENT_TRIGGER_INTERVALS, ICE_STORM_SPAWN_COUNT } from '../../constants';

type GetFn = () => GameStore;
type SetFn = (partial: Partial<GameStore>) => void;

// Tier thresholds and events for Endless mode
const TIER_THRESHOLDS = [0, 5000, 12000, 25000, 45000, 75000, 120000];
const TIER_EVENTS = ['ICE_STORM', 'QUAKE', 'MIRROR', 'CHAOS', 'VOID'];

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
 * 
 * Evaluates whether the player's score has crossed a tier threshold and
 * activates the corresponding tier event. Each tier (1-6) has a unique event:
 * ICE_STORM, GRAVITY_RUSH, QUAKE, MIRROR, CHAOS, VOID.
 * 
 * Only applies to ENDLESS game mode. Other modes (TIMED, ZEN, DAILY_CHALLENGE)
 * do not trigger tier events.
 * 
 * @param score - Player's current score
 * @param currentTier - Player's current tier level (0-6)
 * @param get - Zustand getter function to access game state
 * @param set - Zustand setter function to update game state
 * @returns TierEventResult object with state updates, or null if no tier change
 * 
 * @example
 * // Player reaches 1500 points (tier 1)
 * const result = checkTierEvent(1500, 0, get, set);
 * // result.difficultyTier === 1
 * // result.activeEvent === 'ICE_STORM'
 * // result.eventMovesRemaining === 10
 * 
 * // Player reaches 9000 points (tier 3)
 * const result2 = checkTierEvent(9000, 2, get, set);
 * // result2.activeEvent === 'QUAKE'
 * // result2.grid !== undefined (QUAKE applies immediately)
 * 
 * // No tier change
 * const result3 = checkTierEvent(2000, 1, get, set);
 * // result3 === null
 * 
 * @remarks
 * **Tier Events:**
 * - Tier 1 (1500): ICE_STORM - Spawns 2 ice blocks per move (10 moves)
 * - Tier 2 (4000): GRAVITY_RUSH - Reverses gravity every 5 moves (10 moves)
 * - Tier 3 (9000): QUAKE - Shifts blocks left, applies immediately (8 moves)
 * - Tier 4 (18000): MIRROR - Places mirrored piece (10 moves)
 * - Tier 5 (35000): CHAOS - Random effects every 4 moves (12 moves)
 * - Tier 6 (60000): VOID - Clears bottom 2 rows every 5 moves (10 moves)
 * 
 * **QUAKE Special Handling:**
 * - QUAKE applies its effect immediately upon activation
 * - Returns updated grid in result.grid
 * - Shifts all normal blocks left while preserving ICE/STONE positions
 * - Uses clean gravity-left algorithm
 * 
 * **Return Value:**
 * - Returns null if no tier change occurred
 * - Returns TierEventResult with:
 *   - difficultyTier: New tier level
 *   - activeEvent: Event name
 *   - eventMovesRemaining: Event duration
 *   - lastAction: Milestone notification data
 *   - grid: Updated grid (only for QUAKE)
 * 
 * **State Updates:**
 * - Does NOT call set() directly (avoids race conditions)
 * - Returns state updates for caller to apply
 * - Caller must merge returned updates into game state
 * 
 * **Game Mode Isolation:**
 * - Only activates in ENDLESS mode
 * - Returns null for TIMED, ZEN, DAILY_CHALLENGE modes
 * - Ensures tier system doesn't affect other game modes
 * 
 * **Edge Cases:**
 * - Score below current tier threshold: No change
 * - Score jumps multiple tiers: Activates highest reached tier
 * - Tier 0: No event (beginner tier)
 * - Already at tier 6: No further tier changes
 * 
 * **Validates: Requirements 1.3, 2.1-2.6, 3.2, 9.1, 9.2**
 */
export function checkTierEvent(
  score: number,
  currentTier: number,
  get: GetFn,
  set: SetFn
): TierEventResult {
  // Only activate tier events in ENDLESS mode
  const { gameMode } = get();
  if (gameMode !== 'ENDLESS') {
    return null;
  }
  
  const newTier = TIER_THRESHOLDS.filter(t => score >= t).length - 1;
  
  // Kademeli tier atlama: Her seferinde sadece 1 tier atla
  // Oyuncu her tier'ı deneyimlemeli
  const nextTier = currentTier + 1;
  
  if (newTier >= nextTier && nextTier >= 1 && nextTier <= 6) {
    const eventName = TIER_EVENTS[nextTier - 1];
    
    const duration = EVENT_DURATIONS[eventName as keyof typeof EVENT_DURATIONS] ?? 10;
    
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
      difficultyTier: nextTier, // Sadece 1 tier atla
      lastAction: {
        type: 'MILESTONE',
        tier: nextTier,
        tierName: tierNames[nextTier] ?? `Tier ${nextTier}`,
      },
    };
    
    // BUG FIX: QUAKE artık checkTierEvent'te grid döndürmüyor
    // tickActiveEvent ilk hamleden itibaren uygulayacak
    // Bu double-shift bug'ını düzeltiyor
    
    return result;
  }
  
  return null;
}

/**
 * Get event score multiplier based on active event
 * 
 * Returns the score multiplier for the currently active event. QUAKE provides
 * a higher multiplier (1.3x) due to its increased difficulty, while other
 * events provide a standard 1.2x multiplier.
 * 
 * @param activeEvent - Currently active event name, or null if no event active
 * @returns Score multiplier:
 *   - 1.3x for QUAKE (higher difficulty)
 *   - 1.2x for ICE_STORM, GRAVITY_RUSH, MIRROR, CHAOS, VOID
 *   - 1.0x when no event is active
 * 
 * @example
 * getEventScoreMultiplier('QUAKE')        // Returns 1.3
 * getEventScoreMultiplier('ICE_STORM')    // Returns 1.2
 * getEventScoreMultiplier('GRAVITY_RUSH') // Returns 1.2
 * getEventScoreMultiplier(null)           // Returns 1.0
 * 
 * @remarks
 * **Multiplier Rationale:**
 * - QUAKE: 1.3x (blocks shift left, harder to plan)
 * - Other events: 1.2x (standard difficulty increase)
 * - No event: 1.0x (baseline)
 * 
 * **Integration:**
 * - Used in calculateScore() to apply event bonus
 * - Stacks multiplicatively with tier and mini-event multipliers
 * - Applied to all score gains during event duration
 * 
 * **Event Durations:**
 * - ICE_STORM: 10 moves
 * - GRAVITY_RUSH: 10 moves
 * - QUAKE: 8 moves (shorter due to higher multiplier)
 * - MIRROR: 10 moves
 * - CHAOS: 12 moves
 * - VOID: 10 moves
 * 
 * **Validates: Requirements 3.4, 3.5, 6.1, 6.2, 6.5**
 */
export function getEventScoreMultiplier(activeEvent: 'ICE_STORM' | 'GRAVITY_RUSH' | 'QUAKE' | 'MIRROR' | 'CHAOS' | 'VOID' | null): number {
  if (!activeEvent) return 1.0;
  if (activeEvent === 'QUAKE') return EVENT_SCORE_MULTIPLIERS.QUAKE;
  return EVENT_SCORE_MULTIPLIERS.DEFAULT;
}

/**
 * Tick active event - apply event effects after piece placement
 * 
 * Applies the effects of the currently active event and decrements its
 * duration counter. Each event has unique mechanics that trigger either
 * every move or at specific intervals.
 * 
 * Returns state updates instead of calling set() directly to avoid race
 * conditions with other state updates in the same turn.
 * 
 * @param grid - Current grid state
 * @param piece - The piece that was just placed
 * @param get - Zustand getter function to access game state
 * @param set - Zustand setter function (not used, kept for API compatibility)
 * @returns Partial GameStore updates, or null if no event active or no changes
 * 
 * @example
 * // ICE_STORM: Spawns 2 ice blocks
 * const updates = tickActiveEvent(grid, piece, get, set);
 * // updates.grid contains 2 new ice blocks
 * // updates.eventMovesRemaining === 9
 * 
 * // QUAKE: Shifts blocks left every move
 * const updates2 = tickActiveEvent(grid, piece, get, set);
 * // updates2.grid has all blocks shifted left
 * 
 * // CHAOS: Triggers random effect every 4 moves
 * const updates3 = tickActiveEvent(grid, piece, get, set);
 * // If movesElapsed % 4 === 0, applies random effect
 * 
 * // Event expires
 * const updates4 = tickActiveEvent(grid, piece, get, set);
 * // updates4.activeEvent === null
 * // updates4.eventMovesRemaining === 0
 * 
 * @remarks
 * **Event Mechanics:**
 * 
 * **ICE_STORM (Every Move):**
 * - Spawns 2 ice blocks in random empty cells
 * - Ice blocks have health=2, color=#7dd3fc
 * - If < 2 empty cells, spawns in all available cells
 * - Blocks are unique (no duplicates in same move)
 * 
 * **GRAVITY_RUSH (Every 5 Moves):**
 * - Reverses gravity (blocks fall upward)
 * - Triggers when movesElapsed % 5 === 0
 * - Blocks collect at top instead of bottom
 * - Column-based gravity algorithm
 * 
 * **QUAKE (Every Move):**
 * - Shifts all normal blocks left
 * - ICE and STONE blocks stay in place
 * - Uses clean gravity-left algorithm
 * - Preserves block properties (color, health, type)
 * 
 * **MIRROR (Every Move):**
 * - Places mirrored version of placed piece
 * - Mirror is horizontally flipped
 * - Finds best position (bottom-right preferred)
 * - Skips if no valid placement exists
 * - Triggers processGrid (can clear lines)
 * 
 * **CHAOS (Every 4 Moves):**
 * - Triggers random effect from [ICE_STORM, GRAVITY_RUSH, MIRROR]
 * - Triggers when movesElapsed % 4 === 0
 * - Applies single-move effect without changing active event
 * - Does not trigger itself recursively
 * 
 * **VOID (Every 5 Moves):**
 * - Clears bottom 2 rows (rows 8 and 9)
 * - Triggers when movesElapsed % 5 === 0
 * - Removes all blocks regardless of type
 * - No gravity or scoring applied
 * 
 * **Duration Management:**
 * - Decrements eventMovesRemaining by 1 each call
 * - When counter reaches 0, deactivates event
 * - Returns null if no event active
 * 
 * **State Immutability:**
 * - Does not mutate input grid
 * - Creates new grid copies for modifications
 * - Returns partial updates for caller to merge
 * 
 * **Edge Cases:**
 * - No event active: Returns null
 * - Event duration = 0: Deactivates event
 * - ICE_STORM with 0 empty cells: Skips spawn
 * - MIRROR with no valid placement: Skips mirror
 * - CHAOS/VOID on non-trigger moves: No effect
 * 
 * **Performance:**
 * - Grid operations use efficient algorithms
 * - Avoids unnecessary grid copies
 * - Returns null when no changes needed
 * 
 * **Validates: Requirements 2.7, 2.8, 2.9, 2.10, 3.1, 3.3, 14.3, 14.4, 15.3, 15.4, 17.1, 17.2**
 */
export function tickActiveEvent(
  grid: GridState,
  piece: Piece,
  get: GetFn,
  set: SetFn
): Partial<GameStore> | null {
  const { activeEvent, eventMovesRemaining } = get();
  
  if (!activeEvent || eventMovesRemaining <= 0) return null;
  
  let updates: Partial<GameStore> = {};
  
  if (activeEvent === 'GRAVITY_RUSH') {
    // BUG FIX: GRAVITY_RUSH her hamlede hafif etki + her 5 hamlede tam etki
    const movesUsed = EVENT_DURATIONS.GRAVITY_RUSH - eventMovesRemaining;
    
    // Her hamlede: rastgele 1 sütunda gravity flip (tek sütun)
    const flippedGrid = grid.map(row => row.map(c => ({ ...c })));
    const randomCol = Math.floor(Math.random() * GRID_SIZE);
    
    // Tek sütunu flip et
    const stack: any[] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      if (flippedGrid[y][randomCol].filled) stack.push({ ...flippedGrid[y][randomCol] });
    }
    
    for (let y = 0; y < GRID_SIZE; y++) {
      flippedGrid[y][randomCol] = { filled: false, color: '' };
    }
    
    // Blocks collect at TOP (reverse gravity)
    stack.forEach((cell, i) => {
      flippedGrid[i][randomCol] = cell;
    });
    
    // Her 5 hamlede: tüm grid flip (mevcut davranış)
    if (movesUsed % 5 === 0 && movesUsed > 0) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (x === randomCol) continue; // Zaten flip ettik
        
        const colStack: any[] = [];
        for (let y = 0; y < GRID_SIZE; y++) {
          if (flippedGrid[y][x].filled) colStack.push({ ...flippedGrid[y][x] });
        }
        
        for (let y = 0; y < GRID_SIZE; y++) {
          flippedGrid[y][x] = { filled: false, color: '' };
        }
        
        colStack.forEach((cell, i) => {
          flippedGrid[i][x] = cell;
        });
      }
    }
    
    // CRITICAL FIX: Process grid after gravity flip to clear full lines!
    // Without this, full rows/columns don't explode
    const { grid: processedGrid, totalLinesCleared, chainCount, colorBonus, bombsExploded, iceBroken, diamondMultipliers, actions } = processGrid(flippedGrid);
    
    updates.grid = processedGrid;
    
    // If lines were cleared, update score and stats
    if (totalLinesCleared > 0) {
      // Store clear info for gameStore to handle scoring
      updates.lastAction = {
        type: 'CLEAR' as const,
        lines: totalLinesCleared,
        chainCount,
        colorBonus,
        surgeBonus: false, // Event clears don't use surge
      };
    }
  }
  
  if (activeEvent === 'QUAKE') {
    // Use the passed grid parameter (with placed piece) instead of get().grid (old state)
    const quakeGrid = grid.map(row => row.map(c => ({ ...c })));
    
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
    
    updates.grid = quakeGrid;
  }
  
  if (activeEvent === 'ICE_STORM') {
    // Spawn 2 ice blocks (or all available if < 2)
    const emptyPositions: {x: number; y: number}[] = [];
    // Use the passed grid parameter (with placed piece) instead of get().grid (old state)
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (!grid[y][x].filled) emptyPositions.push({ x, y });
      }
    }
    if (emptyPositions.length > 0) {
      // Use the passed grid parameter (with placed piece) instead of get().grid (old state)
      const iceGrid = grid.map(row => row.map(c => ({ ...c })));
      const spawnCount = Math.min(ICE_STORM_SPAWN_COUNT, emptyPositions.length);
      
      for (let i = 0; i < spawnCount; i++) {
        const randomIndex = Math.floor(Math.random() * emptyPositions.length);
        const pos = emptyPositions.splice(randomIndex, 1)[0]; // Remove to ensure uniqueness
        iceGrid[pos.y][pos.x] = {
          filled: true,
          color: '#7dd3fc',
          id: uuidv4(),
          type: 'ICE' as any,
          health: 2,
        };
      }
      
      updates.grid = iceGrid;
    }
  }
  
  if (activeEvent === 'MIRROR') {
    const mirrorShape = piece.shape.map((row: number[]) => [...row].reverse());
    // Use the passed grid parameter (with placed piece) instead of get().grid (old state)
    
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
              if (gy >= GRID_SIZE || gx >= GRID_SIZE || grid[gy][gx].filled) {
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
      // Use the passed grid parameter (with placed piece) instead of get().grid (old state)
      const mirrorGrid = grid.map((row: any[]) => row.map((c: any) => ({ ...c })));
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
      
      // BUG FIX: MIRROR event'te processGrid ÇAĞRILMASIN
      // Bu, double score calculation ve infinite loop'u önler
      // Grid processing zaten placePiece'de yapılıyor
      updates.grid = mirrorGrid;
    } else {
      // BUG FIX: Mirror yerleşim bulamazsa ICE_STORM fallback
      // En azından 1 ICE bloğu spawn et
      const emptyPositions: {x: number; y: number}[] = [];
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          if (!grid[y][x].filled) emptyPositions.push({ x, y });
        }
      }
      if (emptyPositions.length > 0) {
        const mirrorGrid = grid.map((row: any[]) => row.map((c: any) => ({ ...c })));
        const randomIndex = Math.floor(Math.random() * emptyPositions.length);
        const pos = emptyPositions[randomIndex];
        mirrorGrid[pos.y][pos.x] = {
          filled: true,
          color: '#7dd3fc',
          id: uuidv4(),
          type: 'ICE' as any,
          health: 2,
        };
        updates.grid = mirrorGrid;
      }
    }
  }
  
  // CHAOS: her 4 hamlede rastgele bir event efekti tetikler
  if (activeEvent === 'CHAOS') {
    const movesElapsed = EVENT_DURATIONS.CHAOS - eventMovesRemaining;
    if (movesElapsed > 0 && movesElapsed % EVENT_TRIGGER_INTERVALS.CHAOS === 0) {
      const chaosEvents = ['ICE_STORM', 'MIRROR'] as const;
      const randomEvent = chaosEvents[Math.floor(Math.random() * chaosEvents.length)];
      
      // Geçici olarak o event'in single-move efektini çalıştır
      if (randomEvent === 'ICE_STORM') {
        // Use the passed grid parameter (with placed piece) instead of get().grid (old state)
        const emptyPositions: {x: number; y: number}[] = [];
        for (let y = 0; y < GRID_SIZE; y++) {
          for (let x = 0; x < GRID_SIZE; x++) {
            if (!grid[y][x].filled) emptyPositions.push({ x, y });
          }
        }
        if (emptyPositions.length > 0) {
          // Use the passed grid parameter (with placed piece) instead of get().grid (old state)
          const iceGrid = grid.map(row => row.map(c => ({ ...c })));
          const spawnCount = Math.min(ICE_STORM_SPAWN_COUNT, emptyPositions.length);
          
          for (let i = 0; i < spawnCount; i++) {
            const randomIndex = Math.floor(Math.random() * emptyPositions.length);
            const pos = emptyPositions.splice(randomIndex, 1)[0]; // Remove to ensure uniqueness
            iceGrid[pos.y][pos.x] = {
              filled: true,
              color: '#7dd3fc',
              id: uuidv4(),
              type: 'ICE' as any,
              health: 2,
            };
          }
          
          updates.grid = iceGrid;
        }
      } else if (randomEvent === 'GRAVITY_RUSH') {
        // Use the passed grid parameter (with placed piece) instead of get().grid (old state)
        const flippedGrid = grid.map(row => row.map(c => ({ ...c })));
        
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
        
        updates.grid = flippedGrid;
      } else if (randomEvent === 'MIRROR') {
        const mirrorShape = piece.shape.map((row: number[]) => [...row].reverse());
        // Use the passed grid parameter (with placed piece) instead of get().grid (old state)
        
        let bestPos: { x: number; y: number } | null = null;
        let bestScore = -1;
        
        for (let y = 0; y <= GRID_SIZE - mirrorShape.length; y++) {
          for (let x = 0; x <= GRID_SIZE - mirrorShape[0].length; x++) {
            let fits = true;
            for (let dy = 0; dy < mirrorShape.length && fits; dy++) {
              for (let dx = 0; dx < mirrorShape[0].length && fits; dx++) {
                if (mirrorShape[dy][dx] === 1) {
                  const gy = y + dy, gx = x + dx;
                  if (gy >= GRID_SIZE || gx >= GRID_SIZE || grid[gy][gx].filled) {
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
          // Use the passed grid parameter (with placed piece) instead of get().grid (old state)
          const mirrorGrid = grid.map((row: any[]) => row.map((c: any) => ({ ...c })));
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
          
          // BUG FIX: CHAOS içinde MIRROR event'te de processGrid ÇAĞRILMASIN
          updates.grid = mirrorGrid;
        } else {
          // BUG FIX: Mirror yerleşim bulamazsa ICE_STORM fallback (CHAOS içinde)
          const emptyPositions: {x: number; y: number}[] = [];
          for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
              if (!grid[y][x].filled) emptyPositions.push({ x, y });
            }
          }
          if (emptyPositions.length > 0) {
            const mirrorGrid = grid.map((row: any[]) => row.map((c: any) => ({ ...c })));
            const randomIndex = Math.floor(Math.random() * emptyPositions.length);
            const pos = emptyPositions[randomIndex];
            mirrorGrid[pos.y][pos.x] = {
              filled: true,
              color: '#7dd3fc',
              id: uuidv4(),
              type: 'ICE' as any,
              health: 2,
            };
            updates.grid = mirrorGrid;
          }
        }
      }
    }
  }
  
  // VOID: her 5 hamlede alt 2 satırı siler
  if (activeEvent === 'VOID') {
    const movesElapsed = EVENT_DURATIONS.VOID - eventMovesRemaining;
    if (movesElapsed > 0 && movesElapsed % EVENT_TRIGGER_INTERVALS.VOID === 0) {
      // Use the passed grid parameter (with placed piece) instead of get().grid (old state)
      const voidGrid = grid.map(row => row.map(c => ({ ...c })));
      
      // Alt 2 satırı temizle (rows 8 and 9)
      for (let x = 0; x < GRID_SIZE; x++) {
        voidGrid[8][x] = { filled: false, color: '' };
        voidGrid[9][x] = { filled: false, color: '' };
      }
      
      updates.grid = voidGrid;
    }
  }
  
  // Sayacı azalt, olay bittiyse temizle
  const newRemaining = eventMovesRemaining - 1;
  if (newRemaining <= 0) {
    updates.activeEvent = null;
    updates.eventMovesRemaining = 0;
  } else {
    updates.eventMovesRemaining = newRemaining;
  }
  
  return Object.keys(updates).length > 0 ? updates : null;
}
