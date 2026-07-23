import { v4 as uuidv4 } from 'uuid';
import type { GameStore } from '../gameStore';
import type { GridState, Piece } from '../../types';
import { CellType, GRID_SIZE } from '../../types';
import {
  EVENT_DURATIONS,
  EVENT_SCORE_MULTIPLIERS,
  EVENT_TRIGGER_INTERVALS,
  ICE_STORM_SPAWN_COUNT,
  TIER_NAMES,
  TIER_THRESHOLDS,
  TIER_UNLOCK_LABELS,
} from '../../constants';

type GetFn = () => GameStore;
type SetFn = (partial: Partial<GameStore>) => void;
type EndlessEvent = 'ICE_STORM' | 'QUAKE' | 'MIRROR' | 'CHAOS' | 'VOID';

const VOID_ZONE_COUNT = 2;
const VOID_ZONE_LIFETIME = 3;
const VOID_COLOR = '#170d28';
const TIER2_FIRE_SPAWN_COUNT = 2;
const TIER2_FIRE_SPREAD_INTERVAL_MOVES = 3;
const TIER2_FIRE_MAX_CELLS = 6;
const LATE_GAME_FIRE_FAST_SPREAD_SCORE = 260000;
const TIER2_FIRE_MIN_SPAWN_DISTANCE = 3;
const TIER2_FIRE_NEAR_CLEAR_OCCUPANCY = GRID_SIZE - 2;

export type FireFeedbackCell = {
  id?: string;
  x: number;
  y: number;
  color: string;
  sourceX?: number;
  sourceY?: number;
};

export type FireSpreadPlan = FireFeedbackCell & {
  sourceX: number;
  sourceY: number;
};

type FireMutationResult = {
  grid: GridState;
  cells: FireFeedbackCell[];
};

const canPieceFitAnywhere = (grid: GridState, piece: Piece): boolean => {
  for (let y = 0; y <= GRID_SIZE - piece.shape.length; y++) {
    for (let x = 0; x <= GRID_SIZE - piece.shape[0].length; x++) {
      let fits = true;
      for (let dy = 0; dy < piece.shape.length && fits; dy++) {
        for (let dx = 0; dx < piece.shape[dy].length; dx++) {
          if (piece.shape[dy][dx] && grid[y + dy][x + dx].filled) {
            fits = false;
            break;
          }
        }
      }
      if (fits) return true;
    }
  }
  return false;
};

const canPlayAnyPiece = (grid: GridState, pieces: Piece[]): boolean =>
  pieces.some(piece => canPieceFitAnywhere(grid, piece));

export const removeVoidZones = (grid: GridState): GridState => grid.map(row => row.map(cell =>
  cell.type === CellType.VOID ? { filled: false, color: '' } : { ...cell }
));

const spawnVoidZones = (grid: GridState, pieces: Piece[]): GridState => {
  const nextGrid = grid.map(row => row.map(cell => ({ ...cell })));
  const candidates: Array<{ x: number; y: number }> = [];

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (!nextGrid[y][x].filled) candidates.push({ x, y });
    }
  }

  for (let i = candidates.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[randomIndex]] = [candidates[randomIndex], candidates[i]];
  }

  let spawned = 0;
  for (const candidate of candidates) {
    const previousCell = nextGrid[candidate.y][candidate.x];
    nextGrid[candidate.y][candidate.x] = {
      filled: true,
      color: VOID_COLOR,
      id: uuidv4(),
      type: CellType.VOID,
      voidTurns: VOID_ZONE_LIFETIME,
    };

    if (pieces.length > 0 && !canPlayAnyPiece(nextGrid, pieces)) {
      nextGrid[candidate.y][candidate.x] = previousCell;
      continue;
    }

    spawned++;
    if (spawned >= VOID_ZONE_COUNT) break;
  }

  return nextGrid;
};

const tickVoidZones = (grid: GridState, pieces: Piece[]): GridState => {
  let hasActiveZone = false;
  const nextGrid = grid.map(row => row.map(cell => {
    if (cell.type !== CellType.VOID) return { ...cell };

    const turnsRemaining = (cell.voidTurns ?? VOID_ZONE_LIFETIME) - 1;
    if (turnsRemaining <= 0) return { filled: false, color: '' };

    hasActiveZone = true;
    return { ...cell, voidTurns: turnsRemaining };
  }));

  return hasActiveZone ? nextGrid : spawnVoidZones(nextGrid, pieces);
};

// Tier thresholds and events for Endless mode
const TIER_EVENTS: Record<number, EndlessEvent | null> = {
  1: 'ICE_STORM',
  2: null,
  3: 'QUAKE',
  4: 'ICE_STORM',
  5: 'QUAKE',
  6: null,
};

const getTierEventDuration = (tier: number, eventName: EndlessEvent | null): number => {
  if (!eventName) return 0;
  if (tier === 1 && eventName === 'ICE_STORM') return 3;
  if (tier === 3 && eventName === 'QUAKE') return 4;
  if (tier === 4 && eventName === 'ICE_STORM') return 5;
  if (tier === 5 && eventName === 'QUAKE') return 6;
  return EVENT_DURATIONS[eventName];
};

const getIceStormSpawnCount = (tier: number): number => (
  tier === 1 ? 1 : ICE_STORM_SPAWN_COUNT
);

const cloneGrid = (grid: GridState): GridState => grid.map(row => row.map(cell => ({ ...cell })));

const shuffleInPlace = <T,>(items: T[]): T[] => {
  for (let i = items.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [items[i], items[randomIndex]] = [items[randomIndex], items[i]];
  }
  return items;
};

const isBurnableNormalCell = (grid: GridState, x: number, y: number): boolean => {
  const cell = grid[y]?.[x];
  return !!cell?.filled && (!cell.type || cell.type === CellType.NORMAL);
};

type Tier2FireSpawnCandidate = {
  x: number;
  y: number;
  priority: number;
};

const getOrthogonalNormalNeighborCount = (grid: GridState, x: number, y: number): number => (
  [
    { x: x + 1, y },
    { x: x - 1, y },
    { x, y: y + 1 },
    { x, y: y - 1 },
  ].filter(pos => isBurnableNormalCell(grid, pos.x, pos.y)).length
);

const getTier2FireSpawnCandidates = (grid: GridState): Tier2FireSpawnCandidate[] => {
  const rowOccupancy = grid.map(row => row.filter(cell => cell.filled).length);
  const columnOccupancy = Array.from({ length: GRID_SIZE }, (_, x) => (
    grid.reduce((count, row) => count + (row[x]?.filled ? 1 : 0), 0)
  ));
  const candidates: Tier2FireSpawnCandidate[] = [];

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (!isBurnableNormalCell(grid, x, y)) continue;

      const hasNormalNeighbor = getOrthogonalNormalNeighborCount(grid, x, y) > 0;
      const isNearClearLine = rowOccupancy[y] >= TIER2_FIRE_NEAR_CLEAR_OCCUPANCY ||
        columnOccupancy[x] >= TIER2_FIRE_NEAR_CLEAR_OCCUPANCY;

      candidates.push({
        x,
        y,
        priority: !isNearClearLine && hasNormalNeighbor
          ? 0
          : !isNearClearLine
            ? 1
            : hasNormalNeighbor
              ? 2
              : 3,
      });
    }
  }

  return candidates;
};

const manhattanDistance = (
  first: Pick<Tier2FireSpawnCandidate, 'x' | 'y'>,
  second: Pick<Tier2FireSpawnCandidate, 'x' | 'y'>
): number => Math.abs(first.x - second.x) + Math.abs(first.y - second.y);

const pickBestRandomCandidate = (candidates: Tier2FireSpawnCandidate[]): Tier2FireSpawnCandidate | null => {
  if (candidates.length === 0) return null;
  const bestPriority = Math.min(...candidates.map(candidate => candidate.priority));
  return shuffleInPlace(candidates.filter(candidate => candidate.priority === bestPriority))[0];
};

const selectTier2FireSpawnCells = (
  grid: GridState,
  requestedCount = TIER2_FIRE_SPAWN_COUNT
): Tier2FireSpawnCandidate[] => {
  const candidates = getTier2FireSpawnCandidates(grid);
  const first = pickBestRandomCandidate(candidates);
  if (!first) return [];

  const selected = [first];
  const targetCount = Math.min(Math.max(1, requestedCount), TIER2_FIRE_MAX_CELLS);

  while (selected.length < targetCount) {
    const remaining = candidates.filter(candidate => !selected.some(chosen => (
      chosen.x === candidate.x && chosen.y === candidate.y
    )));
    if (remaining.length === 0) break;

    const distant = remaining.filter(candidate => selected.every(chosen => (
      manhattanDistance(chosen, candidate) >= TIER2_FIRE_MIN_SPAWN_DISTANCE
    )));
    const pool = distant.length > 0 ? distant : remaining;
    const next = pickBestRandomCandidate(pool);
    if (!next) break;
    selected.push(next);
  }

  return selected;
};

const convertCellsToFire = (
  grid: GridState,
  spawnCells: Tier2FireSpawnCandidate[]
): FireMutationResult => {
  if (spawnCells.length === 0) return { grid, cells: [] };

  const nextGrid = cloneGrid(grid);
  const cells: FireFeedbackCell[] = [];
  spawnCells.forEach(({ x, y }) => {
    const id = nextGrid[y][x].id ?? uuidv4();
    nextGrid[y][x] = {
      ...nextGrid[y][x],
      id,
      type: CellType.FIRE,
      health: 2,
    };
    cells.push({ id, x, y, color: nextGrid[y][x].color });
  });

  return { grid: nextGrid, cells };
};

export function spawnTier2FireWithFeedback(grid: GridState): FireMutationResult {
  const spawnCells = selectTier2FireSpawnCells(grid);
  return convertCellsToFire(grid, spawnCells.slice(0, TIER2_FIRE_SPAWN_COUNT));
}

export function spawnTier2Fire(grid: GridState): GridState {
  return spawnTier2FireWithFeedback(grid).grid;
}

export function ensureLateGameFireMinimumWithFeedback(
  grid: GridState,
  minimumCount: number
): FireMutationResult {
  const existingCount = grid.flat().filter(cell => cell.type === CellType.FIRE).length;
  const missingCount = Math.min(
    Math.max(0, minimumCount - existingCount),
    TIER2_FIRE_MAX_CELLS - existingCount
  );
  if (missingCount === 0) return { grid, cells: [] };

  return convertCellsToFire(grid, selectTier2FireSpawnCells(grid, missingCount));
}

export function getFireSpreadPendingTurns(score: number): number {
  return score >= LATE_GAME_FIRE_FAST_SPREAD_SCORE ? 1 : 2;
}

export function createTier2FireSpreadPlan(grid: GridState): FireSpreadPlan | null {
  return createTier2FireSpreadPlans(grid, 1)[0] ?? null;
}

export function createTier2FireSpreadPlans(
  grid: GridState,
  maxPlans = TIER2_FIRE_SPAWN_COUNT
): FireSpreadPlan[] {
  const fireCells: Array<{ x: number; y: number }> = [];
  let allFireCount = 0;
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const cell = grid[y][x];
      if (cell.filled && cell.type === CellType.FIRE) allFireCount++;
      if (cell.filled && cell.type === CellType.FIRE && (cell.health ?? 2) > 1) {
        fireCells.push({ x, y });
      }
    }
  }

  if (fireCells.length === 0 || allFireCount >= TIER2_FIRE_MAX_CELLS) {
    return [];
  }

  const targetsBySource = new Map<string, Array<{ x: number; y: number }>>();
  fireCells.forEach(source => {
    const targets = [
      { x: source.x + 1, y: source.y },
      { x: source.x - 1, y: source.y },
      { x: source.x, y: source.y + 1 },
      { x: source.x, y: source.y - 1 },
    ].filter(pos => {
      if (pos.x < 0 || pos.x >= GRID_SIZE || pos.y < 0 || pos.y >= GRID_SIZE) return;
      return isBurnableNormalCell(grid, pos.x, pos.y);
    });
    if (targets.length > 0) targetsBySource.set(`${source.x},${source.y}`, targets);
  });

  let availableSources = shuffleInPlace(fireCells.filter(source => (
    targetsBySource.has(`${source.x},${source.y}`)
  )));
  const plans: FireSpreadPlan[] = [];
  const reservedTargets = new Set<string>();
  const planLimit = Math.min(
    Math.max(0, maxPlans),
    TIER2_FIRE_MAX_CELLS - allFireCount
  );

  while (plans.length < planLimit && availableSources.length > 0) {
    if (plans.length > 0) {
      const maxDistance = Math.max(...availableSources.map(source => (
        Math.min(...plans.map(plan => manhattanDistance(source, { x: plan.sourceX, y: plan.sourceY })))
      )));
      availableSources = shuffleInPlace(availableSources.filter(source => (
        Math.min(...plans.map(plan => manhattanDistance(source, { x: plan.sourceX, y: plan.sourceY }))) === maxDistance
      )));
    }

    const source = availableSources.shift()!;
    const targets = (targetsBySource.get(`${source.x},${source.y}`) ?? []).filter(target => (
      !reservedTargets.has(`${target.x},${target.y}`)
    ));

    if (targets.length > 0) {
      const target = shuffleInPlace(targets)[0];
      reservedTargets.add(`${target.x},${target.y}`);
      plans.push({
        id: grid[target.y][target.x].id,
        x: target.x,
        y: target.y,
        color: grid[target.y][target.x].color,
        sourceX: source.x,
        sourceY: source.y,
      });
    }

    availableSources = availableSources.filter(candidate => (
      (targetsBySource.get(`${candidate.x},${candidate.y}`) ?? []).some(target => (
        !reservedTargets.has(`${target.x},${target.y}`)
      ))
    ));
  }

  return plans;
}

export function isTier2FireSpreadPlanValid(grid: GridState, plan: FireSpreadPlan): boolean {
  const source = grid[plan.sourceY]?.[plan.sourceX];
  const isAdjacent = Math.abs(plan.sourceX - plan.x) + Math.abs(plan.sourceY - plan.y) === 1;
  return Boolean(
    source?.filled &&
    source.type === CellType.FIRE &&
    (source.health ?? 2) > 1 &&
    isAdjacent &&
    isBurnableNormalCell(grid, plan.x, plan.y)
  );
}

export function applyTier2FireSpreadPlan(grid: GridState, plan: FireSpreadPlan): FireMutationResult {
  if (!isTier2FireSpreadPlanValid(grid, plan)) return { grid, cells: [] };

  const nextGrid = cloneGrid(grid);
  const id = nextGrid[plan.y][plan.x].id ?? uuidv4();
  nextGrid[plan.y][plan.x] = {
    ...nextGrid[plan.y][plan.x],
    id,
    type: CellType.FIRE,
    health: 2,
  };

  return {
    grid: nextGrid,
    cells: [{
      id,
      x: plan.x,
      y: plan.y,
      color: nextGrid[plan.y][plan.x].color,
      sourceX: plan.sourceX,
      sourceY: plan.sourceY,
    }],
  };
}

export function applyTier2FireSpreadPlans(
  grid: GridState,
  plans: FireSpreadPlan[]
): FireMutationResult {
  let nextGrid = grid;
  const cells: FireFeedbackCell[] = [];

  for (const plan of plans.slice(0, TIER2_FIRE_SPAWN_COUNT)) {
    const activeFireCount = nextGrid.flat().filter(cell => cell.type === CellType.FIRE).length;
    if (activeFireCount >= TIER2_FIRE_MAX_CELLS) break;

    const result = applyTier2FireSpreadPlan(nextGrid, plan);
    nextGrid = result.grid;
    cells.push(...result.cells);
  }

  return { grid: nextGrid, cells };
}

export function spreadTier2FireWithFeedback(
  grid: GridState,
  totalMovesPlayed: number,
  tierStartMove: number
): FireMutationResult {
  const movesInTier = totalMovesPlayed - tierStartMove;
  if (movesInTier <= 0 || movesInTier % TIER2_FIRE_SPREAD_INTERVAL_MOVES !== 0) {
    return { grid, cells: [] };
  }

  const plans = createTier2FireSpreadPlans(grid);
  return plans.length > 0 ? applyTier2FireSpreadPlans(grid, plans) : { grid, cells: [] };
}

export function spreadTier2Fire(grid: GridState, totalMovesPlayed: number, tierStartMove: number): GridState {
  return spreadTier2FireWithFeedback(grid, totalMovesPlayed, tierStartMove).grid;
}

export function extinguishTier2Fire(grid: GridState): GridState {
  let changed = false;
  const nextGrid = grid.map(row => row.map(cell => {
    if (cell.type !== CellType.FIRE) return { ...cell };
    changed = true;
    return {
      ...cell,
      type: CellType.NORMAL,
      health: undefined,
    };
  }));

  return changed ? nextGrid : grid;
}

// Return type for checkTierEvent
type TierEventResult = {
  difficultyTier: number;
  activeEvent: EndlessEvent | null;
  eventMovesRemaining: number;
  tierStartMove?: number;
  lastAction: any;
  grid?: GridState;
} | null;

/**
 * Check if player has reached a new difficulty tier and activate corresponding event
 * 
 * Evaluates whether the player's score has crossed a tier threshold and
 * activates the corresponding tier event.
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
 * // Player reaches 5000 points (tier 1)
 * const result = checkTierEvent(15000, 0, get, set);
 * // result.difficultyTier === 1
 * // result.activeEvent === null
 * // result.eventMovesRemaining === 0
 * 
 * // Player reaches 30000 points (tier 3)
 * const result2 = checkTierEvent(80000, 2, get, set);
 * // result2.activeEvent === 'QUAKE'
 * // result2.eventMovesRemaining === 4
 * 
 * // No tier change
 * const result3 = checkTierEvent(2000, 1, get, set);
 * // result3 === null
 * 
 * @remarks
 * **Tier Events:**
 * - Tier 1 (5000): ICE pieces unlock in the tray, no active event
 * - Tier 2 (15000): BOMB pieces unlock in the tray, no active event
 * - Tier 3 (30000): QUAKE - Shifts blocks left for 4 moves
 * - Tier 4 (55000): ICE_STORM - Adds short ice pressure for 5 moves
 * - Tier 5 (90000): QUAKE - Stronger quake window for 6 moves
 * - Tier 6 (140000): No event; fixed-grid gravity charge becomes active
 * 
 * **QUAKE Special Handling:**
 * - QUAKE applies its effect immediately upon activation
 * - Returns updated grid in result.grid
 * - Shifts all movable blocks left while preserving ICE/VOID positions
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
    const eventName = TIER_EVENTS[nextTier];
    const duration = getTierEventDuration(nextTier, eventName);
    
    const tierNames: Record<number, string> = {
      1: 'Gelişmiş',
      2: 'Uzman',
      3: 'Usta',
      4: 'Efsane',
      5: 'Kaos',
      6: 'Sabit Alan',
    };
    
    const result: TierEventResult = {
      activeEvent: eventName,
      eventMovesRemaining: duration,
      difficultyTier: nextTier, // Sadece 1 tier atla
      lastAction: {
        type: 'MILESTONE',
        tier: nextTier,
        tierName: TIER_NAMES[nextTier] ?? tierNames[nextTier] ?? `Tier ${nextTier}`,
        unlockLabel: TIER_UNLOCK_LABELS[nextTier] ?? 'YENI TIER',
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
 *   - 1.2x for ICE_STORM, MIRROR, CHAOS, VOID
 *   - 1.0x when no event is active
 * 
 * @example
 * getEventScoreMultiplier('QUAKE')        // Returns 1.3
 * getEventScoreMultiplier('ICE_STORM')    // Returns 1.2
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
 * - QUAKE: 8 moves (shorter due to higher multiplier)
 * - MIRROR: 10 moves
 * - CHAOS: 12 moves
 * - VOID: 10 moves
 * 
 * **Validates: Requirements 3.4, 3.5, 6.1, 6.2, 6.5**
 */
export function getEventScoreMultiplier(activeEvent: EndlessEvent | null): number {
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
 * **QUAKE (Every Move):**
 * - Shifts all normal blocks left
 * - ICE and VOID blocks stay in place
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
 * - Triggers random effect from [ICE_STORM, MIRROR]
 * - Triggers when movesElapsed % 4 === 0
 * - Applies single-move effect without changing active event
 * - Does not trigger itself recursively
 * 
 * **VOID:**
 * - Temporarily blocks 2 empty cells for 3 player moves
 * - Relocates expired zones while preserving at least one playable tray piece
 * - Zones cannot complete lines, clear, explode, or move with gravity
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
 * - VOID with no safe spawn position: Skips zone creation
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
  set: SetFn,
  availablePieces: Piece[] = [piece]
): Partial<GameStore> | null {
  const { activeEvent, eventMovesRemaining, difficultyTier } = get();
  
  if (!activeEvent || eventMovesRemaining <= 0) return null;
  
  let updates: Partial<GameStore> = {};
  if (activeEvent === 'QUAKE') {
    // Use the passed grid parameter (with placed piece) instead of get().grid (old state)
    const quakeGrid = grid.map(row => row.map(c => ({ ...c })));
    
    for (let r = 0; r < GRID_SIZE; r++) {
      const iceMap = new Map<number, any>();
      for (let c = 0; c < GRID_SIZE; c++) {
        const cell = quakeGrid[r][c];
        if (cell.filled && (cell.type === 'ICE' || cell.type === 'VOID')) {
          iceMap.set(c, { ...cell });
        }
      }
      
      const normalBlocks: any[] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        const cell = quakeGrid[r][c];
        if (cell.filled && cell.type !== 'ICE' && cell.type !== 'VOID') {
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
    // Tier 1 introduces one board ice per move across three moves.
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
      const spawnCount = Math.min(getIceStormSpawnCount(difficultyTier), emptyPositions.length);
      
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
  
  // VOID zones block cells for three player moves, then relocate safely.
  if (activeEvent === 'VOID') {
    updates.grid = tickVoidZones(grid, availablePieces);
  }
  
  // Sayacı azalt, olay bittiyse temizle
  const newRemaining = eventMovesRemaining - 1;
  if (newRemaining <= 0) {
    if (activeEvent === 'VOID') {
      updates.grid = removeVoidZones((updates.grid as GridState | undefined) ?? grid);
    }
    updates.activeEvent = null;
    updates.eventMovesRemaining = 0;
  } else {
    updates.eventMovesRemaining = newRemaining;
  }
  
  return Object.keys(updates).length > 0 ? updates : null;
}
