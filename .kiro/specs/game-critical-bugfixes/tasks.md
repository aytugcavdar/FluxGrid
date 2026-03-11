# Implementation Plan: Game Critical Bugfixes

## Overview

This plan addresses 11 critical bugs through targeted fixes to game logic, UI components, and event handling. Tasks are organized by bug category for efficient implementation and testing.

## Tasks

- [ ] 1. Fix Game Logic Bugs (gameStore.ts)
  - [ ] 1.1 Fix endless mode game over detection
    - Modify placePiece to check gameMode before setting isGameOver based on movesLeft
    - Ensure checkGameOver correctly handles endless mode by only checking piece placement ability
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [ ]* 1.2 Write property test for endless mode game over
    - **Property 1: Endless mode game over ignores move limit**
    - **Validates: Requirements 1.2, 1.3**
  
  - [ ] 1.3 Fix combo counter reset logic
    - In placePiece, set combo to 0 when linesCleared is 0
    - Ensure combo increments correctly when lines are cleared
    - _Requirements: 2.1, 2.2, 2.4_
  
  - [ ]* 1.4 Write property tests for combo system
    - **Property 2: Combo increments on line clear**
    - **Property 3: Combo resets on no clear**
    - **Property 4: Combo multiplier only applies when combo > 0**
    - **Validates: Requirements 2.1, 2.2, 2.4**
  
  - [ ] 1.5 Fix career mode score calculation order
    - Calculate newScore before updating objectives
    - Use newScore when updating SCORE objective
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [ ]* 1.6 Write property tests for objective tracking
    - **Property 5: SCORE objective reflects current score**
    - **Property 6: Level complete when all objectives met**
    - **Validates: Requirements 3.2, 3.3, 3.4**

- [ ] 2. Implement ice objective tracking
  - [ ] 2.1 Add iceBroken return value to processGrid
    - Add iceBroken counter to processGrid function
    - Increment counter when ice blocks are fully destroyed (not just damaged)
    - Return iceBroken in ProcessGridResult
    - _Requirements: 4.1, 4.4_
  
  - [ ] 2.2 Update placePiece to track ice broken
    - Destructure iceBroken from processGrid result
    - Update ICE objectives with iceBroken value
    - Update stats.iceBroken counter
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [ ]* 2.3 Write property tests for ice tracking
    - **Property 7: Ice broken counter increments on ice destruction**
    - **Property 8: ICE objective updates with ice broken**
    - **Validates: Requirements 4.1, 4.2, 4.3**
  
  - [ ]* 2.4 Write unit test for ice damage edge case
    - Test that ice with health=1 doesn't increment counter when hit again
    - _Requirements: 4.4_

- [ ] 3. Implement reward flux application
  - [ ] 3.1 Apply reward flux on level completion
    - In placePiece, when levelFinished is true, retrieve rewardFlux from level definition
    - Add rewardFlux to current flux, capped at 100
    - Update flux state
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [ ]* 3.2 Write property tests for flux rewards
    - **Property 9: Reward flux applied on level complete**
    - **Property 10: Flux persists across level transitions**
    - **Property 13: Flux never exceeds maximum**
    - **Validates: Requirements 5.2, 5.3, 5.4**
  
  - [ ]* 3.3 Write unit test for zero reward flux
    - Test that levels with no rewardFlux don't cause errors
    - _Requirements: 5.1, 5.2_

- [ ] 4. Checkpoint - Ensure all game logic tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Fix mobile UI issues
  - [ ] 5.1 Create responsive drag offset utility
    - Create utils/responsive.ts with getDragYOffset function
    - Implement screen-height-based offset calculation
    - Export function for use in multiple components
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [ ]* 5.2 Write property test for drag offset consistency
    - **Property 11: Drag offset consistency**
    - **Validates: Requirements 7.1, 7.2, 7.3**
  
  - [ ] 5.3 Update DragOverlay to use shared offset utility
    - Import getDragYOffset from utils/responsive
    - Replace hardcoded offset calculation with utility function
    - _Requirements: 7.1, 7.4_
  
  - [ ] 5.4 Update Grid to use shared offset utility
    - Import getDragYOffset from utils/responsive
    - Replace hardcoded DRAG_Y_OFFSET calculation with utility function
    - _Requirements: 7.2, 7.4_
  
  - [ ]* 5.5 Write unit test for drag offset alignment
    - Test that DragOverlay and Grid use same offset value
    - _Requirements: 7.4_
  
  - [ ] 5.6 Fix piece tray responsive layout
    - Update index.css with responsive --tray-height using clamp()
    - Add media queries for mobile and short screens
    - Add safe-area-inset-bottom for notch handling
    - Adjust main grid area max-height to account for tray
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [ ]* 5.7 Write unit tests for mobile tray layout
    - Test tray height on various screen sizes
    - Test that tray doesn't overlap HUD
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 6. Fix double placement bug
  - [ ] 6.1 Add placement handled flag to Grid component
    - Create placementHandledRef useRef in Grid.tsx
    - Update handleCanvasPointerUp to set flag and call stopPropagation
    - Update handleWindowPointerUp to check flag before placing
    - Reset flag after placement completes
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  
  - [ ]* 6.2 Write property test for single placement
    - **Property 12: Single placement per pointer action**
    - **Validates: Requirements 8.2, 8.3, 8.4**
  
  - [ ]* 6.3 Write unit test for event handling
    - Test that canvas pointerup prevents window handler
    - Test that placement only occurs once
    - _Requirements: 8.1, 8.2_

- [ ] 7. Implement skill visual feedback
  - [ ] 7.1 Add skill overlay meshes to Grid render loop
    - Create skillOverlayMeshesRef in Grid.tsx
    - In render loop, dispose old overlays each frame
    - When Shatter skill is active, create red pulsing overlay on hovered filled cell
    - When Bomb skill is active, create orange pulsing overlays on 3x3 area
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  
  - [ ]* 7.2 Write unit tests for skill overlays
    - Test that Shatter creates single overlay on filled cell
    - Test that Bomb creates 9 overlays in 3x3 pattern
    - Test that overlays are disposed when skill deactivates
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 8. Personalize game over screen
  - [ ] 8.1 Create getGameOverMessage helper function in App.tsx
    - Implement function that returns title, subtitle, description based on gameMode
    - Handle endless mode: "Harika Oyun!", "Artık Hamle Kalmadı"
    - Handle timed mode: "Süre Doldu!", "Quantum Rush Sona Erdi"
    - Handle career mode: Different messages for moves vs objectives failure
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [ ] 8.2 Update game over modal to use personalized messages
    - Call getGameOverMessage() to get message object
    - Update JSX to display title, subtitle, description
    - Add mode-specific stats section for endless mode
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  
  - [ ]* 8.3 Write unit tests for game over messages
    - Test correct message for each game mode
    - Test that mode-specific stats are displayed
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 9. Fix navigation consistency
  - [ ] 9.1 Update HOME screen navigation
    - Change "KARİYER" button label to "SEVİYE HARİTASI"
    - Ensure button navigates to AppState.MAP
    - _Requirements: 11.1, 11.3_
  
  - [ ] 9.2 Verify MODES screen navigation
    - Confirm "KARİYER" option navigates to AppState.MAP
    - Ensure button has clear description
    - _Requirements: 11.2, 11.3_
  
  - [ ] 9.3 Consider removing AppState.CAREER
    - Evaluate if CAREER page is needed or if MAP is sufficient
    - If removing, update all CAREER references to MAP
    - _Requirements: 11.1, 11.2, 11.4_
  
  - [ ]* 9.4 Write unit tests for navigation
    - Test HOME button navigates to correct state
    - Test MODES button navigates to correct state
    - _Requirements: 11.1, 11.2, 11.4_

- [ ] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Integration testing and validation
  - [ ] 11.1 Test endless mode end-to-end
    - Play endless mode until game over
    - Verify game over triggers correctly
    - Verify game over message is appropriate
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 10.1_
  
  - [ ] 11.2 Test career mode end-to-end
    - Play career level with SCORE and ICE objectives
    - Verify objectives update correctly
    - Verify reward flux is applied on completion
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 5.2, 5.3_
  
  - [ ] 11.3 Test mobile UI on various devices
    - Test on small phone (375px width)
    - Test on large phone (428px width)
    - Test on tablet (768px width)
    - Verify no overlap, correct drag alignment
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4_
  
  - [ ] 11.4 Test skill usage with visual feedback
    - Activate Shatter skill and hover over cells
    - Activate Bomb skill and hover over cells
    - Verify overlays appear and disappear correctly
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  
  - [ ] 11.5 Test navigation flow
    - Navigate from HOME to MAP
    - Navigate from MODES to MAP
    - Verify no confusion or conflicts
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end workflows
- Priority: Game logic bugs (1-4) > Mobile UI (5-6) > UX enhancements (7-9)
