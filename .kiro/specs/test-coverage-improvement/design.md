# Test Coverage Improvement - Design

## Architecture Overview

### Testing Approach
We'll use a **targeted coverage strategy** focusing on high-impact, low-coverage files. The goal is to reach thresholds efficiently without over-testing.

### Coverage Calculation
```
Current: Lines 25.44%, Functions 26.07%, Branches 19.98%
Target:  Lines 33%,     Functions 29%,     Branches 28%
Gap:     +7.56%,        +2.93%,            +8.02%
```

To close the gap, we need to add approximately **150-200 new test cases** across priority files.

## File-by-File Testing Strategy

### 1. gameStore.ts (Priority: CRITICAL)
**Current:** 1.07% lines, 1.49% functions
**Target:** 30% lines, 25% functions
**Impact:** Highest - core game logic

#### Test Categories

##### A. State Initialization
```typescript
describe('gameStore initialization', () => {
  it('should initialize with default state')
  it('should load saved game from localStorage')
  it('should handle corrupted localStorage data')
})
```

##### B. Piece Placement
```typescript
describe('placePiece', () => {
  it('should place piece on empty grid')
  it('should reject placement on occupied cells')
  it('should reject placement outside grid bounds')
  it('should update score after placement')
  it('should trigger line clearing after placement')
})
```

##### C. Line Clearing
```typescript
describe('line clearing', () => {
  it('should clear completed rows')
  it('should clear completed columns')
  it('should clear multiple lines simultaneously')
  it('should calculate correct score for cleared lines')
  it('should trigger combo on consecutive clears')
})
```

##### D. Scoring System
```typescript
describe('scoring', () => {
  it('should award points for piece placement')
  it('should award bonus for line clears')
  it('should multiply score during combo')
  it('should award perfect bonus')
  it('should update high score')
})
```

##### E. Game Over
```typescript
describe('game over', () => {
  it('should detect game over when no valid moves')
  it('should save final score')
  it('should reset game state')
  it('should submit score to leaderboard')
})
```

**Estimated Coverage Gain:** +25% lines, +20% functions

---

### 2. Grid.tsx (Priority: CRITICAL)
**Current:** 1.37% lines
**Target:** 25% lines
**Challenge:** BabylonJS rendering (hard to test)

#### Testing Strategy
Focus on **logic, not rendering**. Mock BabylonJS dependencies.

##### A. Component Mounting
```typescript
describe('Grid component', () => {
  it('should render without crashing')
  it('should initialize BabylonJS scene')
  it('should cleanup on unmount')
})
```

##### B. Grid State Rendering
```typescript
describe('grid rendering', () => {
  it('should render empty grid')
  it('should render grid with placed pieces')
  it('should highlight valid placement positions')
  it('should show clearing animation')
})
```

##### C. User Interactions
```typescript
describe('user interactions', () => {
  it('should handle piece drag start')
  it('should update preview during drag')
  it('should place piece on drop')
  it('should cancel placement on invalid drop')
})
```

**Estimated Coverage Gain:** +20% lines

---

### 3. leaderboardStore.ts (Priority: HIGH)
**Current:** 2.88% lines, 9.09% functions
**Target:** 25% lines, 20% functions

#### Test Categories

##### A. Leaderboard Fetching
```typescript
describe('fetchLeaderboard', () => {
  it('should fetch top 10 from cache')
  it('should fetch full leaderboard from Firestore')
  it('should handle network errors')
  it('should update state on success')
})
```

##### B. Score Submission
```typescript
describe('submitScore', () => {
  it('should submit score to Firestore')
  it('should calculate percentile')
  it('should update local state')
  it('should handle submission errors')
})
```

##### C. Caching
```typescript
describe('leaderboard caching', () => {
  it('should use cached data when available')
  it('should refresh cache on demand')
  it('should invalidate stale cache')
})
```

**Estimated Coverage Gain:** +20% lines, +15% functions

---

### 4. authStore.ts (Priority: HIGH)
**Current:** 6.32% lines, 22.22% functions
**Target:** 30% lines, 35% functions

#### Test Categories

##### A. Authentication Flow
```typescript
describe('authentication', () => {
  it('should sign in with Google')
  it('should sign out')
  it('should handle auth errors')
  it('should persist auth state')
})
```

##### B. User State
```typescript
describe('user state', () => {
  it('should initialize with null user')
  it('should update user on sign in')
  it('should clear user on sign out')
  it('should sync user data with Firestore')
})
```

##### C. Anonymous Users
```typescript
describe('anonymous users', () => {
  it('should allow anonymous gameplay')
  it('should prompt for sign in on leaderboard')
  it('should migrate data after sign in')
})
```

**Estimated Coverage Gain:** +20% lines, +15% functions

---

### 5. audio.ts (Priority: MEDIUM)
**Current:** 10.16% lines
**Target:** 30% lines

#### Testing Strategy
Mock Web Audio API and Howler.js

##### A. Audio Playback
```typescript
describe('audio playback', () => {
  it('should play sound effect')
  it('should play background music')
  it('should handle missing audio files')
  it('should respect mute state')
})
```

##### B. Volume Control
```typescript
describe('volume control', () => {
  it('should mute all sounds')
  it('should unmute all sounds')
  it('should adjust volume level')
})
```

##### C. Audio Loading
```typescript
describe('audio loading', () => {
  it('should preload audio files')
  it('should handle loading errors')
  it('should retry failed loads')
})
```

**Estimated Coverage Gain:** +15% lines

---

## Mock Strategy

### Firebase Mocks
```typescript
// tests/mocks/firebase.ts
export const mockFirestore = {
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
}

export const mockAuth = {
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}
```

### BabylonJS Mocks
```typescript
// tests/mocks/babylon.ts
export const mockEngine = {
  dispose: vi.fn(),
  resize: vi.fn(),
}

export const mockScene = {
  render: vi.fn(),
  dispose: vi.fn(),
}
```

### Audio Mocks
```typescript
// tests/mocks/audio.ts
export const mockHowl = {
  play: vi.fn(),
  pause: vi.fn(),
  stop: vi.fn(),
  volume: vi.fn(),
}
```

## Test Organization

### Directory Structure
```
tests/
├── unit/
│   ├── features/
│   │   ├── game/
│   │   │   ├── store/
│   │   │   │   └── gameStore.test.ts (NEW - 200+ lines)
│   │   │   └── components/
│   │   │       └── Grid.test.tsx (NEW - 150+ lines)
│   │   ├── leaderboard/
│   │   │   └── store/
│   │   │       └── leaderboardStore.test.ts (NEW - 100+ lines)
│   │   └── auth/
│   │       └── store/
│   │           └── authStore.test.ts (NEW - 100+ lines)
│   └── utils/
│       └── audio.test.ts (NEW - 80+ lines)
├── mocks/
│   ├── firebase.ts (NEW)
│   ├── babylon.ts (NEW)
│   └── audio.ts (NEW)
└── setup.ts (EXISTING)
```

## Correctness Properties

### Property 1: Score Monotonicity
**Statement:** Score should never decrease during gameplay
```typescript
// Property-based test
fc.assert(
  fc.property(fc.array(validPiecePlacement), (placements) => {
    const scores = placements.map(p => gameStore.getState().score);
    return scores.every((s, i) => i === 0 || s >= scores[i-1]);
  })
);
```

### Property 2: Grid Integrity
**Statement:** Grid should never have invalid cell states
```typescript
fc.assert(
  fc.property(fc.array(validPiecePlacement), (placements) => {
    const grid = gameStore.getState().grid;
    return grid.every(row => 
      row.every(cell => cell === 0 || cell === 1)
    );
  })
);
```

### Property 3: Line Clearing Correctness
**Statement:** Cleared lines should always be full before clearing
```typescript
fc.assert(
  fc.property(fc.array(validPiecePlacement), (placements) => {
    // Before clearing, all cleared lines must be full
    const clearedLines = detectClearedLines(grid);
    return clearedLines.every(line => line.every(cell => cell === 1));
  })
);
```

## Implementation Plan

### Phase 1: Critical Coverage (gameStore + Grid)
1. Create gameStore.test.ts with 50+ test cases
2. Create Grid.test.tsx with 30+ test cases
3. Create necessary mocks (Firebase, BabylonJS)
4. Run coverage - expect 28-30% lines

### Phase 2: Store Coverage (leaderboard + auth)
1. Create leaderboardStore.test.ts with 25+ test cases
2. Create authStore.test.ts with 25+ test cases
3. Run coverage - expect 31-32% lines

### Phase 3: Utility Coverage (audio)
1. Create audio.test.ts with 20+ test cases
2. Run coverage - expect 33%+ lines ✅

### Phase 4: Refinement
1. Identify remaining gaps
2. Add targeted tests for uncovered branches
3. Ensure all thresholds met

## Testing Best Practices

### DO
- Test behavior, not implementation
- Use descriptive test names
- Mock external dependencies
- Test edge cases and error paths
- Keep tests fast (<100ms each)
- Use arrange-act-assert pattern

### DON'T
- Test private methods directly
- Over-mock (mock only boundaries)
- Write brittle tests (coupled to implementation)
- Skip error handling tests
- Test framework code (React, Zustand internals)

## Success Criteria
- ✅ Lines coverage ≥ 33%
- ✅ Functions coverage ≥ 29%
- ✅ Branches coverage ≥ 28%
- ✅ All 249+ existing tests pass
- ✅ New tests are maintainable and readable
- ✅ Test execution time < 15 seconds

## Risk Mitigation

### Risk: BabylonJS testing complexity
**Mitigation:** Mock BabylonJS, test logic only, not rendering

### Risk: Firebase async operations
**Mitigation:** Use vi.fn() mocks, control async resolution

### Risk: Flaky tests
**Mitigation:** Avoid timers, use deterministic mocks

### Risk: Test execution time
**Mitigation:** Parallelize tests, minimize setup/teardown

## Maintenance Plan
- Run coverage on every PR
- Block merges if coverage drops below thresholds
- Review new code for testability
- Refactor untestable code when possible
