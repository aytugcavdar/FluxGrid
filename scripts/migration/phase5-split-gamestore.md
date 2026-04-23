# Phase 5: GameStore Split Migration Guide

## Overview

The monolithic gameStore (1200+ lines) has been split into 5 focused stores:

1. **gridStore** - Grid state and operations
2. **pieceStore** - Piece state and operations  
3. **scoreStore** - Score, combo, and scoring
4. **progressionStore** - Level, experience, progression
5. **multiplierStore** - Multiplier state and calculations

## Migration Strategy

### Option 1: Gradual Migration (Recommended)

Keep the original gameStore as a facade that uses the split stores internally. This allows components to be migrated gradually.

**Pros:**
- No breaking changes
- Components can be migrated one at a time
- Easy rollback if issues arise

**Cons:**
- Temporary code duplication
- Two sources of truth during migration

### Option 2: Big Bang Migration

Replace gameStore entirely with split stores and update all components at once.

**Pros:**
- Clean architecture immediately
- No temporary duplication

**Cons:**
- High risk of breaking changes
- Difficult to test incrementally
- Hard to rollback

## Recommended Approach: Gradual Migration

### Step 1: Create Split Stores (DONE)

✅ Created:
- `src/features/game/store/gridStore.ts`
- `src/features/game/store/pieceStore.ts`
- `src/features/game/store/scoreStore.ts`
- `src/features/game/store/progressionStore.ts`
- `src/features/game/store/multiplierStore.ts`

### Step 2: Update gameStore to Use Split Stores Internally

Modify the existing gameStore to delegate to split stores while maintaining the same API.

**Example:**
```typescript
// Old: Direct state
const useGameStore = create((set, get) => ({
  grid: createEmptyGrid(),
  score: 0,
  // ...
}));

// New: Delegate to split stores
const useGameStore = create((set, get) => ({
  // Delegate grid operations
  get grid() { return useGridStore.getState().grid; },
  get score() { return useScoreStore.getState().score; },
  // ...
}));
```

### Step 3: Migrate Components Gradually

Update components one at a time to use split stores directly:

**Before:**
```typescript
const { grid, score, placePiece } = useGameStore();
```

**After:**
```typescript
const { grid } = useGridStore();
const { score } = useScoreStore();
const placePiece = useGameStore(state => state.placePiece); // Keep high-level actions in gameStore
```

### Step 4: Remove Facade Layer

Once all components are migrated, remove the gameStore facade and use split stores directly.

## Current Status

- ✅ Split stores created
- ⏳ gameStore facade update (in progress)
- ⏳ Component migration (not started)
- ⏳ Facade removal (not started)

## Next Steps

1. Update gameStore to delegate to split stores
2. Test that existing functionality still works
3. Create a component migration checklist
4. Migrate components one by one
5. Remove facade layer when all components are migrated

## Testing Strategy

1. **Unit Tests**: Test each split store independently
2. **Integration Tests**: Test gameStore facade with split stores
3. **E2E Tests**: Test full game flow with split stores
4. **Manual Testing**: Play the game to ensure no regressions

## Rollback Plan

If issues arise:
1. Revert to `gameStore.backup.ts`
2. Remove split store files
3. Update imports back to original gameStore

## Notes

- The original gameStore is backed up at `gameStore.backup.ts`
- Split stores are independent and can be tested in isolation
- High-level game actions (placePiece, initGame, etc.) should remain in gameStore facade
- Low-level operations (updateCell, addScore, etc.) are in split stores
