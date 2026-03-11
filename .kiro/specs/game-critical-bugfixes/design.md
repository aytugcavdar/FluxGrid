# Design Document: Game Critical Bugfixes

## Overview

This design addresses 11 critical bugs in the FluxGrid puzzle game through targeted fixes to game logic, state management, UI components, and event handling. The fixes are organized into four categories:

1. **Game Logic Fixes** (Requirements 1-5): Core gameplay mechanics including game over detection, combo system, score calculation, objective tracking, and reward application
2. **Mobile UI Fixes** (Requirements 6-7): Responsive layout and drag-and-drop alignment issues
3. **Event Handling Fixes** (Requirement 8): Duplicate event prevention
4. **UX Enhancement Fixes** (Requirements 9-11): Visual feedback, personalized screens, and navigation clarity

## Architecture

### Component Structure

```
gameStore.ts (Zustand Store)
├── State Management
│   ├── Game state (grid, pieces, score, combo, movesLeft)
│   ├── Mode state (gameMode, isGameOver, isLevelComplete)
│   └── Objective state (levelObjectives, stats)
├── Game Logic
│   ├── initGame() - Initialize game for different modes
│   ├── placePiece() - Handle piece placement and scoring
│   ├── processGrid() - Clear lines and handle special blocks
│   └── checkGameOver() - Determine if game should end
└── Objective Tracking
    └── Update objectives based on game actions

Grid.tsx (3D Rendering Component)
├── Babylon.js Scene Management
├── Hover Detection & Ghost Pieces
├── Event Handlers (pointerup, pointermove)
└── Skill Visual Feedback

App.tsx (Main Application)
├── Game Over Modal
├── Drag Overlay
└── Navigation State Management

HUD.tsx (Heads-Up Display)
└── Display game info and objectives

index.css (Styling)
└── Responsive layout variables
```

### Data Flow

```
User Action → Event Handler → Store Action → State Update → UI Re-render
                                    ↓
                            Objective Tracking
                                    ↓
                            Reward Application
```

## Components and Interfaces

### 1. Game Store Modifications (gameStore.ts)

#### Bug Fix 1: Endless Mode Game Over

**Current Issue:**
```typescript
movesLeft: mode === GameMode.CAREER ? (firstLevel.movesLimit || 0) : 999
// Later in placePiece:
if (get().movesLeft <= 0 && !levelFinished) {
  set({ isGameOver: true });
}
```

**Fix:**
```typescript
// In placePiece, after piece placement:
if (get().gameMode === GameMode.CAREER && get().movesLeft <= 0 && !levelFinished) {
  set({ isGameOver: true });
}
// checkGameOver() already handles endless mode correctly by checking piece placement
```

#### Bug Fix 2: Combo Reset

**Current Issue:**
```typescript
// In placePiece:
combo: comboMultiplier, // This sets combo to the multiplier, not resets it
```

**Fix:**
```typescript
// In placePiece, after calculating comboMultiplier:
const newCombo = linesCleared > 0 ? comboMultiplier : 0; // Reset to 0 if no lines cleared
set({
  // ...
  combo: newCombo,
  // ...
});
```

#### Bug Fix 3: Career Mode Score Calculation

**Current Issue:**
```typescript
// In placePiece, objectives are updated BEFORE score is calculated:
const updatedObjectives = get().levelObjectives.map(obj => {
  let current = obj.current;
  if (obj.type === ObjectiveType.SCORE) current = score + Math.round(...); // Uses OLD score
  // ...
});
// Score is calculated AFTER:
const newScore = score + pointsGained;
```

**Fix:**
```typescript
// Calculate new score FIRST:
const newScore = score + pointsGained;

// Then update objectives using newScore:
const updatedObjectives = get().levelObjectives.map(obj => {
  let current = obj.current;
  if (obj.type === ObjectiveType.SCORE) current = newScore; // Use NEW score
  if (obj.type === ObjectiveType.CLEAR_LINES) current += linesCleared;
  if (obj.type === ObjectiveType.CHAIN_REACTION) current += chainCount;
  if (obj.type === ObjectiveType.USE_BOMB) current += bombsExploded;
  if (obj.type === ObjectiveType.BREAK_ICE) current += iceBroken; // See Bug Fix 4
  return { ...obj, current: Math.min(obj.target, current) };
});
```

#### Bug Fix 4: Ice Objective Tracking

**Current Issue:**
```typescript
// processGrid returns bombsExploded but not iceBroken
// placePiece doesn't track ice broken
```

**Fix:**
```typescript
// In processGrid, add ice tracking:
const processGrid = (initialGrid: GridState): {
  grid: GridState;
  totalLinesCleared: number;
  chainCount: number;
  colorBonus: boolean;
  bombsExploded: number;
  iceBroken: number; // NEW
} => {
  // ...
  let iceBroken = 0;
  
  // In processHit function:
  const processHit = (x: number, y: number) => {
    const cell = currentGrid[y][x];
    if (!cell.filled) return;

    if (cell.type === CellType.ICE && (cell.health || 0) > 1) {
      cell.health = (cell.health || 2) - 1;
      // Ice damaged but not broken
    } else {
      const key = `${x},${y}`;
      if (!finalCellsToClear.has(key)) {
        finalCellsToClear.add(key);
        if (cell.type === CellType.ICE) {
          iceBroken++; // Track ice broken
        }
        if (cell.type === CellType.BOMB) {
          explosionQueue.push({x, y});
          bombsExploded++;
        }
      }
    }
  };
  
  return { grid: currentGrid, totalLinesCleared, chainCount, colorBonus, bombsExploded, iceBroken };
};

// In placePiece:
const { grid: newGrid, totalLinesCleared: linesCleared, chainCount, colorBonus, bombsExploded, iceBroken } = processGrid(tempGrid);

// Update objectives:
if (obj.type === ObjectiveType.BREAK_ICE) current += iceBroken;

// Update stats:
const nextStats: GameStats = {
  // ...
  iceBroken: currentStats.iceBroken + iceBroken,
};
```

#### Bug Fix 5: Reward Flux Application

**Current Issue:**
```typescript
// In placePiece, when level is complete:
if (levelFinished) {
  const nextMax = Math.max(get().maxLevelReached, get().currentLevelIndex + 1);
  set({ maxLevelReached: nextMax });
  localStorage.setItem('flux_max_level', nextMax.toString());
}
// rewardFlux is never applied
```

**Fix:**
```typescript
// In placePiece, when level is complete:
if (levelFinished) {
  const nextMax = Math.max(get().maxLevelReached, get().currentLevelIndex + 1);
  set({ maxLevelReached: nextMax });
  localStorage.setItem('flux_max_level', nextMax.toString());
  
  // Apply reward flux
  const currentLevelDef = generateLevel(get().currentLevelIndex);
  if (currentLevelDef.rewardFlux) {
    const newFlux = Math.min(100, get().flux + currentLevelDef.rewardFlux);
    set({ flux: newFlux });
  }
}
```

### 2. Mobile UI Fixes

#### Bug Fix 6: Piece Tray Overlap

**Current Issue:**
```css
/* In index.css */
.game-tray {
  --tray-height: 140px; /* Fixed height causes overlap on small screens */
}
```

**Fix:**
```css
/* Responsive tray height */
.game-tray {
  --tray-height: clamp(120px, 18vh, 160px); /* Scales with viewport height */
  height: var(--tray-height);
  padding-bottom: env(safe-area-inset-bottom); /* Handle notches */
}

/* Adjust grid area to account for tray */
main {
  max-height: calc(100dvh - var(--tray-height) - 60px); /* 60px for HUD */
}

@media (max-width: 768px) {
  .game-tray {
    --tray-height: clamp(110px, 16vh, 140px); /* Smaller on mobile */
  }
}

@media (max-height: 700px) {
  .game-tray {
    --tray-height: 100px; /* Even smaller on short screens */
  }
}
```

#### Bug Fix 7: Drag Offset Consistency

**Current Issue:**
```typescript
// In DragOverlay (App.tsx):
const yOffset = isMobile ? Math.min(-90, -window.innerHeight * 0.11) : 0;

// In Grid.tsx:
const DRAG_Y_OFFSET = (stateRef.current.draggedPiece && isMobile) ? Math.min(-90, -window.innerHeight * 0.11) : 0;
// These are calculated separately and might not match
```

**Fix:**
```typescript
// Create a shared utility function in utils/responsive.ts:
export const getDragYOffset = (): number => {
  const isMobile = window.innerWidth < 768;
  if (!isMobile) return 0;
  
  // Calculate based on screen height for better alignment
  const screenHeight = window.innerHeight;
  if (screenHeight < 700) return -70;  // Short screens
  if (screenHeight < 800) return -90;  // Medium screens
  return Math.min(-90, -screenHeight * 0.11); // Tall screens
};

// In DragOverlay (App.tsx):
import { getDragYOffset } from './utils/responsive';
const yOffset = getDragYOffset();

// In Grid.tsx:
import { getDragYOffset } from '../utils/responsive';
const DRAG_Y_OFFSET = stateRef.current.draggedPiece ? getDragYOffset() : 0;
```

### 3. Event Handling Fix

#### Bug Fix 8: Double Placement Prevention

**Current Issue:**
```typescript
// In Grid.tsx:
const handleWindowPointerUp = () => {
  const { draggedPiece } = stateRef.current;
  if (draggedPiece && hoverCoordRef.current) {
    placePiece(draggedPiece, hoverCoordRef.current.x, hoverCoordRef.current.y);
  }
  // ...
};

const handleCanvasPointerUp = () => {
  const { activeSkill } = stateRef.current;
  const hover = hoverCoordRef.current;
  if (activeSkill === SkillType.SHATTER && hover) {
    // Skill logic
  }
  // If draggedPiece exists, this might also trigger placement
};

window.addEventListener('pointerup', handleWindowPointerUp);
canvasRef.current.addEventListener('pointerup', handleCanvasPointerUp);
// Both events can fire for the same pointer action
```

**Fix:**
```typescript
// Use event.stopPropagation() and a placement flag:
const placementHandledRef = useRef(false);

const handleCanvasPointerUp = (e: PointerEvent) => {
  const { activeSkill, draggedPiece } = stateRef.current;
  const hover = hoverCoordRef.current;
  
  // Handle skill usage
  if (activeSkill === SkillType.SHATTER && hover) {
    if (hover.x >= 0 && hover.x < GRID_SIZE && hover.y >= 0 && hover.y < GRID_SIZE) {
      useShatter(hover.x, hover.y);
      e.stopPropagation(); // Prevent window handler
      return;
    }
  }
  
  // Handle piece placement
  if (draggedPiece && hover && !placementHandledRef.current) {
    placementHandledRef.current = true;
    placePiece(draggedPiece, hover.x, hover.y);
    setDraggedPiece(null);
    hoverCoordRef.current = null;
    setHoverCoord(null);
    e.stopPropagation(); // Prevent window handler
  }
};

const handleWindowPointerUp = () => {
  const { draggedPiece } = stateRef.current;
  
  // Only handle if canvas didn't already handle it
  if (draggedPiece && hoverCoordRef.current && !placementHandledRef.current) {
    placePiece(draggedPiece, hoverCoordRef.current.x, hoverCoordRef.current.y);
  }
  
  // Reset state
  setDraggedPiece(null);
  hoverCoordRef.current = null;
  setHoverCoord(null);
  globalMouseRef.current = null;
  placementHandledRef.current = false; // Reset for next placement
};
```

### 4. UX Enhancement Fixes

#### Bug Fix 9: Skill Visual Feedback

**Current Issue:**
```typescript
// In Grid.tsx render loop:
// Shatter skill shows pulsating blocks but no clear indication of clickable cells
if (activeSkill === SkillType.SHATTER && cell.type === CellType.NORMAL) {
  const pulsate = 0.8 + Math.abs(Math.sin(time * 5)) * 0.4;
  (mesh.material as BABYLON.StandardMaterial).emissiveColor =
    BABYLON.Color3.FromHexString(cell.color).scale(pulsate);
}
// No visual feedback for Bomb skill
```

**Fix:**
```typescript
// In Grid.tsx render loop, add skill overlay meshes:
const skillOverlayMeshesRef = useRef<BABYLON.Mesh[]>([]);

// In render loop:
// Clear old overlays
skillOverlayMeshesRef.current.forEach(m => m.dispose());
skillOverlayMeshesRef.current = [];

const currentHover = hoverCoordRef.current;
if (activeSkill && currentHover) {
  if (activeSkill === SkillType.SHATTER) {
    // Highlight the single hovered cell
    if (currentHover.x >= 0 && currentHover.x < GRID_SIZE && 
        currentHover.y >= 0 && currentHover.y < GRID_SIZE &&
        grid[currentHover.y][currentHover.x].filled) {
      
      const overlay = BABYLON.MeshBuilder.CreateBox("shatter-overlay", {
        size: CELL_SIZE * 0.95,
        height: 0.7
      }, scene);
      overlay.position = getVectorPos(currentHover.x, currentHover.y);
      overlay.position.y = 0.1;
      
      const mat = new BABYLON.StandardMaterial("shatterMat", scene);
      mat.emissiveColor = BABYLON.Color3.FromHexString("#ef4444");
      mat.alpha = 0.3 + Math.sin(time * 8) * 0.15; // Pulsing
      overlay.material = mat;
      overlay.isPickable = false;
      
      skillOverlayMeshesRef.current.push(overlay);
    }
  } else if (activeSkill === SkillType.BOMB) {
    // Highlight 3x3 area
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = currentHover.x + dx;
        const y = currentHover.y + dy;
        
        if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
          const overlay = BABYLON.MeshBuilder.CreateBox("bomb-overlay", {
            size: CELL_SIZE * 0.95,
            height: 0.7
          }, scene);
          overlay.position = getVectorPos(x, y);
          overlay.position.y = 0.1;
          
          const mat = new BABYLON.StandardMaterial("bombMat", scene);
          mat.emissiveColor = BABYLON.Color3.FromHexString("#f97316");
          mat.alpha = 0.25 + Math.sin(time * 8) * 0.1; // Pulsing
          overlay.material = mat;
          overlay.isPickable = false;
          
          skillOverlayMeshesRef.current.push(overlay);
        }
      }
    }
  }
}
```

#### Bug Fix 10: Personalized Game Over Screen

**Current Issue:**
```typescript
// In App.tsx:
<h2 className="text-2xl font-bold text-white mb-2">
  {gameMode === GameMode.TIMED && timeLeft <= 0 ? 'Süre Bitti' :
    movesLeft <= 0 ? 'Hamle Bitti' : 'Oyun Bitti'}
</h2>
// Generic message, doesn't differentiate between endless and other modes
```

**Fix:**
```typescript
// In App.tsx, create a helper function:
const getGameOverMessage = () => {
  if (gameMode === GameMode.ENDLESS) {
    return {
      title: 'Harika Oyun!',
      subtitle: 'Artık Hamle Kalmadı',
      description: 'Tüm parçalar yerleştirilemez durumda'
    };
  }
  
  if (gameMode === GameMode.TIMED) {
    if (timeLeft <= 0) {
      return {
        title: 'Süre Doldu!',
        subtitle: 'Quantum Rush Sona Erdi',
        description: `${score.toLocaleString()} puan kazandın`
      };
    }
  }
  
  if (gameMode === GameMode.CAREER) {
    if (movesLeft <= 0) {
      return {
        title: 'Hamle Bitti',
        subtitle: `Seviye ${currentLevelIndex} Başarısız`,
        description: 'Hedeflere ulaşamadın'
      };
    }
    // If objectives not met
    return {
      title: 'Oyun Bitti',
      subtitle: `Seviye ${currentLevelIndex}`,
      description: 'Artık hamle kalmadı'
    };
  }
  
  return {
    title: 'Oyun Bitti',
    subtitle: 'Tekrar Dene',
    description: ''
  };
};

const gameOverMsg = getGameOverMessage();

// In JSX:
<h2 className="text-2xl font-bold text-white mb-2">{gameOverMsg.title}</h2>
<p className="text-gray-400 text-xs uppercase tracking-wider mb-2">{gameOverMsg.subtitle}</p>
{gameOverMsg.description && (
  <p className="text-gray-500 text-xs mb-4">{gameOverMsg.description}</p>
)}

// Add mode-specific stats
{gameMode === GameMode.ENDLESS && (
  <div className="bg-white/5 rounded-xl p-3 mb-4">
    <p className="text-xs text-gray-400 mb-1">En Yüksek Kombo</p>
    <p className="text-lg font-bold text-amber-400">{Math.max(.../* track max combo */)}</p>
  </div>
)}
```

#### Bug Fix 11: Navigation Consistency

**Current Issue:**
```typescript
// In App.tsx HOME screen:
<button onClick={() => { playClick(); setAppState(AppState.CAREER); }}>
  KARİYER
</button>

// In MODES screen:
<button onClick={() => { playClick(); setAppState(AppState.MAP); }}>
  KARİYER
</button>
// Both labeled "KARİYER" but go to different places
```

**Fix:**
```typescript
// Option 1: Make HOME button go to MAP (recommended)
// In App.tsx HOME screen:
<button
  onClick={() => { playClick(); setAppState(AppState.MAP); }}
  className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 font-bold tracking-widest transition-all active:scale-95 uppercase text-xs"
>
  SEVİYE HARİTASI
</button>

// In MODES screen, keep as is:
<button onClick={() => { playClick(); setAppState(AppState.MAP); }}>
  <span className="block text-xl font-black text-white italic tracking-tight mb-1">KARİYER</span>
  <span className="block text-[10px] text-white/40 font-bold uppercase tracking-widest">Hikaye Modu & Görevler</span>
</button>

// Option 2: Remove CAREER page entirely and always use MAP
// Remove AppState.CAREER references
// Update HOME button to go directly to MAP
```

## Data Models

### Modified GameStore State

```typescript
interface GameStore {
  // ... existing fields ...
  
  // Modified behavior (no new fields needed):
  // - combo: now properly resets to 0
  // - movesLeft: checked conditionally based on gameMode
  // - flux: receives reward on level complete
}
```

### Modified ProcessGrid Return Type

```typescript
interface ProcessGridResult {
  grid: GridState;
  totalLinesCleared: number;
  chainCount: number;
  colorBonus: boolean;
  bombsExploded: number;
  iceBroken: number; // NEW FIELD
}
```

### New Utility Function

```typescript
// utils/responsive.ts
export const getDragYOffset = (): number => {
  const isMobile = window.innerWidth < 768;
  if (!isMobile) return 0;
  
  const screenHeight = window.innerHeight;
  if (screenHeight < 700) return -70;
  if (screenHeight < 800) return -90;
  return Math.min(-90, -screenHeight * 0.11);
};
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, I identified the following consolidations:

- Properties 3.2 and 3.3 are redundant - both test that SCORE objective matches actual score. Consolidated into Property 3.
- Properties 7.1, 7.2, and 7.3 all test drag offset consistency. Consolidated into Property 7.
- Properties 8.2, 8.3, and 8.4 all relate to preventing duplicate placements. Consolidated into Property 8.

### Correctness Properties

**Property 1: Endless mode game over ignores move limit**
*For any* grid state in endless mode, isGameOver should only be true when no pieces can be placed, regardless of movesLeft value
**Validates: Requirements 1.2, 1.3**

**Property 2: Combo increments on line clear**
*For any* piece placement that clears lines, the combo counter should increase by 1
**Validates: Requirements 2.1**

**Property 3: Combo resets on no clear**
*For any* piece placement that clears zero lines, the combo counter should be reset to 0
**Validates: Requirements 2.2**

**Property 4: Combo multiplier only applies when combo > 0**
*For any* score calculation, combo multipliers should only be applied when combo counter is greater than 0
**Validates: Requirements 2.4**

**Property 5: SCORE objective reflects current score**
*For any* piece placement in career mode, the SCORE objective current value should equal the player's actual score after the placement
**Validates: Requirements 3.2, 3.3**

**Property 6: Level complete when all objectives met**
*For any* game state where all objective current values are >= their targets, isLevelComplete should be true
**Validates: Requirements 3.4**

**Property 7: Ice broken counter increments on ice destruction**
*For any* ice block that is fully destroyed (health reaches 0), the ice broken counter should increment by 1
**Validates: Requirements 4.1, 4.2**

**Property 8: ICE objective updates with ice broken**
*For any* ICE objective, its current value should equal the total number of ice blocks broken
**Validates: Requirements 4.2, 4.3**

**Property 9: Reward flux applied on level complete**
*For any* level completion, if the level has rewardFlux defined, the player's flux should increase by that amount (capped at 100)
**Validates: Requirements 5.2, 5.3**

**Property 10: Flux persists across level transitions**
*For any* level transition via nextLevel(), the flux value should remain unchanged from the previous level
**Validates: Requirements 5.4**

**Property 11: Drag offset consistency**
*For any* screen size, the getDragYOffset() function should return the same value when called by both DragOverlay and Grid components
**Validates: Requirements 7.1, 7.2, 7.3**

**Property 12: Single placement per pointer action**
*For any* pointer up event, piece placement should occur at most once, even if multiple event handlers are triggered
**Validates: Requirements 8.2, 8.3, 8.4**

**Property 13: Flux never exceeds maximum**
*For any* flux update operation (placement, reward, surge), the flux value should never exceed 100
**Validates: Requirements 5.3**

## Error Handling

### Invalid State Handling

1. **Negative Combo**: If combo somehow becomes negative, clamp to 0
2. **Invalid Objective Type**: If an unknown objective type is encountered, log warning and skip
3. **Missing Level Definition**: If generateLevel returns undefined, use default values
4. **Flux Overflow**: Always clamp flux to [0, 100] range

### Edge Cases

1. **Ice with health=1**: Ensure ice broken counter only increments when ice is fully destroyed, not when damaged
2. **Multiple objectives of same type**: Handle multiple SCORE or ICE objectives correctly
3. **Zero reward flux**: Handle levels with no rewardFlux gracefully (don't add undefined)
4. **Screen resize during drag**: Recalculate offset on resize events
5. **Rapid pointer events**: Use debouncing or flags to prevent race conditions

### Validation

1. **Placement validation**: Always call canPlacePiece before applying placement
2. **Objective bounds**: Clamp objective current values to [0, target]
3. **Mode-specific logic**: Check gameMode before applying mode-specific rules
4. **Null checks**: Verify draggedPiece, hoverCoord exist before using

## Testing Strategy

### Dual Testing Approach

This bugfix spec requires both unit tests and property-based tests:

- **Unit tests**: Verify specific bug fixes, edge cases, and UI rendering
- **Property tests**: Verify universal properties across all game states

### Unit Testing Focus

Unit tests should cover:

1. **Specific bug scenarios**: Test the exact conditions that caused each bug
2. **Edge cases**: Ice damage vs destruction, zero rewards, empty objectives
3. **UI rendering**: Game over messages, skill overlays, navigation buttons
4. **Event handling**: Pointer event sequences, duplicate prevention
5. **Integration**: Component interactions (DragOverlay + Grid offset)

Example unit tests:
- Endless mode with movesLeft=999 doesn't trigger game over from moves
- Placing piece with no clears resets combo to 0
- SCORE objective uses new score value, not old
- Ice with health=1 doesn't increment counter when hit again
- Completing level with rewardFlux=50 increases flux by 50
- Mobile tray height doesn't overlap HUD on 375px width screen
- getDragYOffset returns same value in both components
- Pointer up on canvas prevents window handler from firing
- Shatter skill shows overlay on hovered filled cell
- Endless mode game over shows "Harika Oyun!" title
- HOME "KARİYER" button navigates to MAP

### Property-Based Testing Configuration

- **Library**: fast-check (for TypeScript/JavaScript)
- **Iterations**: Minimum 100 per property test
- **Tag format**: `Feature: game-critical-bugfixes, Property {number}: {property_text}`

Property tests should cover:

1. **Property 1**: Generate random grid states and piece sets in endless mode, verify game over logic
2. **Property 2-4**: Generate random piece placements, verify combo behavior
3. **Property 5-6**: Generate random career mode states, verify objective tracking
4. **Property 7-8**: Generate random ice placements and clears, verify counter
5. **Property 9-10**: Generate random level completions, verify flux rewards
6. **Property 11**: Generate random screen sizes, verify offset consistency
7. **Property 12**: Simulate rapid pointer events, verify single placement
8. **Property 13**: Generate random flux operations, verify max cap

### Test Organization

```
tests/
├── unit/
│   ├── gameStore.test.ts
│   │   ├── Bug 1: Endless mode game over
│   │   ├── Bug 2: Combo reset
│   │   ├── Bug 3: Career score calculation
│   │   ├── Bug 4: Ice objective tracking
│   │   └── Bug 5: Reward flux application
│   ├── Grid.test.tsx
│   │   ├── Bug 7: Drag offset
│   │   ├── Bug 8: Double placement
│   │   └── Bug 9: Skill visual feedback
│   ├── App.test.tsx
│   │   ├── Bug 10: Game over messages
│   │   └── Bug 11: Navigation consistency
│   └── responsive.test.ts
│       └── Bug 6: Mobile tray layout
│       └── Bug 7: Drag offset utility
├── properties/
│   ├── gameLogic.properties.test.ts
│   │   ├── Property 1: Endless game over
│   │   ├── Property 2-4: Combo system
│   │   ├── Property 5-6: Objectives
│   │   └── Property 13: Flux cap
│   ├── iceTracking.properties.test.ts
│   │   ├── Property 7: Ice counter
│   │   └── Property 8: ICE objective
│   ├── rewards.properties.test.ts
│   │   ├── Property 9: Reward flux
│   │   └── Property 10: Flux persistence
│   └── eventHandling.properties.test.ts
│       ├── Property 11: Offset consistency
│       └── Property 12: Single placement
└── integration/
    ├── endlessMode.integration.test.ts
    ├── careerMode.integration.test.ts
    └── mobileUI.integration.test.ts
```

### Testing Priority

**High Priority** (Critical bugs affecting gameplay):
1. Bug 1: Endless mode game over
2. Bug 2: Combo reset
3. Bug 3: Career score calculation
4. Bug 8: Double placement

**Medium Priority** (Important but less critical):
5. Bug 4: Ice objective tracking
6. Bug 5: Reward flux
7. Bug 7: Drag offset
8. Bug 9: Skill feedback

**Low Priority** (UX improvements):
9. Bug 6: Mobile tray layout
10. Bug 10: Game over messages
11. Bug 11: Navigation consistency
