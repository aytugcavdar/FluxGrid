# Test Coverage Improvement - Requirements

## Overview
Improve test coverage to meet vitest thresholds. Current coverage is below required thresholds, causing CI/CD failures.

## Current State
- Lines: 25.44% (threshold: 33%) - **7.56% gap**
- Functions: 26.07% (threshold: 29%) - **2.93% gap**
- Branches: 19.98% (threshold: 28%) - **8.02% gap**

## Problem Statement
The test suite is passing (249 tests), but coverage thresholds are not met. This blocks deployment and indicates insufficient test coverage for critical game logic.

## User Stories

### 1. As a developer, I want all tests to pass coverage thresholds
**Acceptance Criteria:**
- Lines coverage ≥ 33%
- Functions coverage ≥ 29%
- Branches coverage ≥ 28%
- All existing tests continue to pass
- No reduction in code quality or test quality

### 2. As a developer, I want core game logic to be well-tested
**Acceptance Criteria:**
- gameStore.ts coverage increases from 1.07% to at least 30%
- Grid.tsx coverage increases from 1.37% to at least 25%
- Tests cover critical game flows (piece placement, line clearing, scoring)
- Tests cover edge cases (grid boundaries, invalid moves, game over)

### 3. As a developer, I want store logic to be tested
**Acceptance Criteria:**
- authStore.ts coverage increases from 6.32% to at least 30%
- leaderboardStore.ts coverage increases from 2.88% to at least 25%
- Tests cover state mutations and side effects
- Tests cover error handling paths

### 4. As a developer, I want utility functions to be tested
**Acceptance Criteria:**
- audio.ts coverage increases from 10.16% to at least 30%
- Tests cover audio playback, muting, and error handling
- Tests cover edge cases (missing audio files, browser compatibility)

## Priority Files (Ordered by Impact)

### High Priority (Must Fix)
1. **gameStore.ts** (1.07% → 30%+)
   - Core game state management
   - Piece placement logic
   - Line clearing and scoring
   - Game over conditions

2. **Grid.tsx** (1.37% → 25%+)
   - Grid rendering
   - Cell interactions
   - Visual feedback

3. **leaderboardStore.ts** (2.88% → 25%+)
   - Leaderboard fetching
   - Score submission
   - Caching logic

### Medium Priority (Should Fix)
4. **authStore.ts** (6.32% → 30%+)
   - Authentication flows
   - User state management
   - Error handling

5. **audio.ts** (10.16% → 30%+)
   - Audio playback
   - Mute/unmute
   - Error handling

### Low Priority (Nice to Have)
6. **HUD.tsx** (41.02% → 50%+)
7. **AbilityPanel.tsx** (16.12% → 30%+)
8. **LevelMap.tsx** (15.62% → 25%+)

## Constraints
- Do not modify production code unless fixing bugs
- Do not skip or remove existing tests
- Use existing test patterns and utilities
- Tests must be maintainable and readable
- Avoid testing implementation details (test behavior, not internals)

## Testing Strategy

### Unit Tests
- Test individual functions and methods in isolation
- Mock external dependencies (Firebase, audio, localStorage)
- Focus on pure logic and state transformations

### Integration Tests
- Test interactions between stores and components
- Test complete user flows (place piece → clear line → update score)
- Use minimal mocking for realistic scenarios

### Property-Based Tests (Optional)
- Use fast-check for complex logic (grid operations, scoring)
- Test invariants (score always increases, grid never overflows)

## Success Metrics
- Coverage thresholds met: Lines ≥33%, Functions ≥29%, Branches ≥28%
- All tests pass (no regressions)
- Test execution time remains under 15 seconds
- No flaky tests introduced

## Out of Scope
- Refactoring production code for testability
- Adding new features
- Performance optimization
- E2E tests with real Firebase/browser APIs

## Dependencies
- Existing test setup (vitest, @testing-library/react, jsdom)
- Existing mocks and test utilities
- fast-check (already installed for PBT)

## Timeline Estimate
- High Priority: 4-6 hours
- Medium Priority: 2-3 hours
- Low Priority: 1-2 hours
- Total: 7-11 hours

## Notes
- Some files are excluded from coverage: `src/services/firebase/**`, `functions/**`, `tests/**`
- Focus on business logic, not Firebase integration (already excluded)
- Grid.tsx is a large BabylonJS component - may need creative testing approach
