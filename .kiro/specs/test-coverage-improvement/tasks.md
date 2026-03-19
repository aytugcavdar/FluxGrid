# Test Coverage Improvement - Tasks

## Phase 1: Setup and Mocks

### Task 1: Create Mock Infrastructure
- [x] 1.1 Create `tests/mocks/firebase.ts` with Firestore and Auth mocks
- [x] 1.2 Create `tests/mocks/babylon.ts` with BabylonJS mocks
- [x] 1.3 Create `tests/mocks/audio.ts` with Howler.js mocks
- [x] 1.4 Update `tests/setup.ts` to register global mocks

**Details:**
- Mock Firebase: `collection`, `doc`, `getDoc`, `setDoc`, `updateDoc`, `onAuthStateChanged`
- Mock BabylonJS: `Engine`, `Scene`, `Camera`, `Light`, `Mesh`
- Mock Audio: `Howl` constructor and methods
- Use `vi.fn()` for all mock functions
- Ensure mocks are reset between tests

---

## Phase 2: Critical Coverage - gameStore.ts

### Task 2: Test gameStore Initialization
- [x] 2.1 Create `tests/unit/features/game/store/gameStore.test.ts`
- [x] 2.2 Test default state initialization
- [x] 2.3 Test loading saved game from localStorage
- [x] 2.4 Test handling corrupted localStorage data
- [x] 2.5 Test state reset functionality

**Details:**
- Mock localStorage with valid and invalid data
- Verify all state properties are initialized correctly
- Test edge cases (missing keys, wrong types)

### Task 3: Test Piece Placement Logic
- [x] 3.1 Test placing piece on empty grid
- [x] 3.2 Test rejecting placement on occupied cells
- [x] 3.3 Test rejecting placement outside grid bounds
- [x] 3.4 Test score update after placement
- [x] 3.5 Test grid state update after placement

**Details:**
- Create helper functions for grid setup
- Test all piece shapes (I, O, T, L, J, S, Z)
- Verify grid state mutations
- Check score calculations

### Task 4: Test Line Clearing Logic
- [ ] 4.1 Test clearing single row
- [ ] 4.2 Test clearing single column
- [ ] 4.3 Test clearing multiple rows simultaneously
- [ ] 4.4 Test clearing multiple columns simultaneously
- [ ] 4.5 Test clearing rows and columns together
- [ ] 4.6 Test score calculation for cleared lines

**Details:**
- Set up grids with complete lines
- Verify correct cells are cleared
- Check score bonuses for multi-line clears
- Test combo triggering

### Task 5: Test Scoring System
- [ ] 5.1 Test base score for piece placement
- [ ] 5.2 Test line clear bonus scoring
- [ ] 5.3 Test combo multiplier
- [ ] 5.4 Test perfect bonus
- [ ] 5.5 Test high score update
- [ ] 5.6 Test score persistence to localStorage

**Details:**
- Verify score formulas match design
- Test edge cases (zero score, max score)
- Check localStorage sync

### Task 6: Test Game Over Logic
- [ ] 6.1 Test game over detection (no valid moves)
- [ ] 6.2 Test final score saving
- [ ] 6.3 Test game state reset
- [ ] 6.4 Test leaderboard submission trigger
- [ ] 6.5 Test statistics update on game over

**Details:**
- Create grids with no valid placements
- Mock Firebase submission
- Verify state cleanup

### Task 7: Run Coverage Check (Checkpoint 1)
- [ ] 7.1 Run `npm run test:coverage`
- [ ] 7.2 Verify gameStore.ts coverage ≥ 25%
- [ ] 7.3 Verify overall lines coverage ≥ 28%

**Expected:** Lines ~28-30%, Functions ~27-28%

---

## Phase 3: Critical Coverage - Grid.tsx

### Task 8: Test Grid Component Basics
- [ ] 8.1 Create `tests/unit/features/game/components/Grid.test.tsx`
- [ ] 8.2 Test component renders without crashing
- [ ] 8.3 Test BabylonJS scene initialization
- [ ] 8.4 Test cleanup on unmount
- [ ] 8.5 Test canvas ref handling

**Details:**
- Mock BabylonJS Engine and Scene
- Verify scene.dispose() called on unmount
- Test with different grid states

### Task 9: Test Grid Rendering Logic
- [ ] 9.1 Test rendering empty grid
- [ ] 9.2 Test rendering grid with placed pieces
- [ ] 9.3 Test highlighting valid placement positions
- [ ] 9.4 Test clearing animation trigger
- [ ] 9.5 Test grid resize handling

**Details:**
- Mock BabylonJS mesh creation
- Verify correct number of meshes created
- Test responsive behavior

### Task 10: Test Grid Interactions
- [ ] 10.1 Test piece drag start
- [ ] 10.2 Test drag preview update
- [ ] 10.3 Test piece placement on drop
- [ ] 10.4 Test invalid placement rejection
- [ ] 10.5 Test hover effects

**Details:**
- Simulate pointer events
- Mock gameStore actions
- Verify visual feedback

### Task 11: Run Coverage Check (Checkpoint 2)
- [ ] 11.1 Run `npm run test:coverage`
- [ ] 11.2 Verify Grid.tsx coverage ≥ 20%
- [ ] 11.3 Verify overall lines coverage ≥ 30%

**Expected:** Lines ~30-31%, Functions ~28-29%

---

## Phase 4: Store Coverage - leaderboardStore.ts

### Task 12: Test Leaderboard Fetching
- [ ] 12.1 Create `tests/unit/features/leaderboard/store/leaderboardStore.test.ts`
- [ ] 12.2 Test fetching top 10 from cache
- [ ] 12.3 Test fetching full leaderboard from Firestore
- [ ] 12.4 Test handling network errors
- [ ] 12.5 Test state updates on success

**Details:**
- Mock Firestore queries
- Test different game modes
- Verify error handling

### Task 13: Test Score Submission
- [ ] 13.1 Test submitting score to Firestore
- [ ] 13.2 Test percentile calculation
- [ ] 13.3 Test local state update
- [ ] 13.4 Test submission error handling
- [ ] 13.5 Test anonymous user handling

**Details:**
- Mock Firebase write operations
- Test with different score values
- Verify optimistic updates

### Task 14: Test Leaderboard Caching
- [ ] 14.1 Test using cached data when available
- [ ] 14.2 Test cache refresh on demand
- [ ] 14.3 Test cache invalidation
- [ ] 14.4 Test cache expiry

**Details:**
- Mock cache reads/writes
- Test TTL logic
- Verify cache hits/misses

---

## Phase 5: Store Coverage - authStore.ts

### Task 15: Test Authentication Flow
- [ ] 15.1 Create `tests/unit/features/auth/store/authStore.test.ts`
- [ ] 15.2 Test Google sign-in
- [ ] 15.3 Test sign-out
- [ ] 15.4 Test auth error handling
- [ ] 15.5 Test auth state persistence

**Details:**
- Mock Firebase Auth
- Test successful and failed auth
- Verify state transitions

### Task 16: Test User State Management
- [ ] 16.1 Test initialization with null user
- [ ] 16.2 Test user update on sign-in
- [ ] 16.3 Test user clear on sign-out
- [ ] 16.4 Test Firestore user data sync
- [ ] 16.5 Test user profile updates

**Details:**
- Mock user objects
- Test state consistency
- Verify Firestore sync

### Task 17: Test Anonymous User Handling
- [ ] 17.1 Test anonymous gameplay
- [ ] 17.2 Test sign-in prompt on leaderboard
- [ ] 17.3 Test data migration after sign-in
- [ ] 17.4 Test anonymous user ID generation

**Details:**
- Test anonymous → authenticated flow
- Verify data preservation
- Test edge cases

### Task 18: Run Coverage Check (Checkpoint 3)
- [ ] 18.1 Run `npm run test:coverage`
- [ ] 18.2 Verify leaderboardStore.ts coverage ≥ 20%
- [ ] 18.3 Verify authStore.ts coverage ≥ 25%
- [ ] 18.4 Verify overall lines coverage ≥ 32%

**Expected:** Lines ~32%, Functions ~29%+

---

## Phase 6: Utility Coverage - audio.ts

### Task 19: Test Audio Playback
- [ ] 19.1 Create `tests/unit/utils/audio.test.ts`
- [ ] 19.2 Test playing sound effects
- [ ] 19.3 Test playing background music
- [ ] 19.4 Test handling missing audio files
- [ ] 19.5 Test respecting mute state

**Details:**
- Mock Howler.js
- Test all sound effect types
- Verify mute behavior

### Task 20: Test Volume Control
- [ ] 20.1 Test muting all sounds
- [ ] 20.2 Test unmuting all sounds
- [ ] 20.3 Test adjusting volume level
- [ ] 20.4 Test volume persistence

**Details:**
- Test volume range (0-1)
- Verify localStorage sync
- Test edge cases

### Task 21: Test Audio Loading
- [ ] 21.1 Test preloading audio files
- [ ] 21.2 Test handling loading errors
- [ ] 21.3 Test retry logic
- [ ] 21.4 Test lazy loading

**Details:**
- Mock file loading
- Test error scenarios
- Verify retry attempts

---

## Phase 7: Final Coverage Push

### Task 22: Run Final Coverage Check
- [ ] 22.1 Run `npm run test:coverage`
- [ ] 22.2 Identify remaining gaps
- [ ] 22.3 Verify lines coverage ≥ 33%
- [ ] 22.4 Verify functions coverage ≥ 29%
- [ ] 22.5 Verify branches coverage ≥ 28%

**Expected:** All thresholds met ✅

### Task 23: Add Targeted Branch Coverage Tests
- [ ] 23.1 Identify uncovered branches from coverage report
- [ ] 23.2 Add tests for error handling branches
- [ ] 23.3 Add tests for edge case branches
- [ ] 23.4 Add tests for conditional logic branches

**Details:**
- Focus on if/else, switch, ternary operators
- Test both true and false paths
- Aim for 28%+ branch coverage

### Task 24: Verify All Tests Pass
- [ ] 24.1 Run `npm test` (all tests)
- [ ] 24.2 Verify 0 failing tests
- [ ] 24.3 Verify no flaky tests (run 3 times)
- [ ] 24.4 Check test execution time < 15s

---

## Phase 8: Property-Based Testing (Optional)

### Task 25: Add Property-Based Tests for gameStore
- [ ] 25.1* Create `tests/unit/features/game/store/gameStore.properties.test.ts`
- [ ] 25.2* Test Property 1: Score Monotonicity
- [ ] 25.3* Test Property 2: Grid Integrity
- [ ] 25.4* Test Property 3: Line Clearing Correctness

**Details:**
- Use fast-check library
- Generate random piece placements
- Verify invariants hold

---

## Phase 9: Documentation and Cleanup

### Task 26: Update Test Documentation
- [ ] 26.1 Document mock usage in README
- [ ] 26.2 Add testing guidelines to CONTRIBUTING.md
- [ ] 26.3 Document coverage thresholds
- [ ] 26.4 Add examples of good tests

### Task 27: Code Review and Refinement
- [ ] 27.1 Review all new tests for quality
- [ ] 27.2 Refactor duplicate test setup code
- [ ] 27.3 Ensure consistent test naming
- [ ] 27.4 Add missing test comments

### Task 28: Final Validation
- [ ] 28.1 Run full test suite with coverage
- [ ] 28.2 Verify all thresholds met
- [ ] 28.3 Verify no regressions
- [ ] 28.4 Commit and push changes

---

## Success Criteria
- ✅ Lines coverage ≥ 33%
- ✅ Functions coverage ≥ 29%
- ✅ Branches coverage ≥ 28%
- ✅ All existing tests pass
- ✅ Test execution time < 15 seconds
- ✅ No flaky tests

## Estimated Effort
- Phase 1 (Setup): 1 hour
- Phase 2 (gameStore): 3 hours
- Phase 3 (Grid): 2 hours
- Phase 4 (leaderboard): 1.5 hours
- Phase 5 (auth): 1.5 hours
- Phase 6 (audio): 1 hour
- Phase 7 (Final): 1 hour
- Phase 8 (PBT): 1 hour (optional)
- Phase 9 (Docs): 0.5 hours

**Total: 11.5 hours** (10.5 hours without PBT)
