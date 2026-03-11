# Requirements Document

## Introduction

This document specifies the requirements for fixing 11 critical bugs in the FluxGrid puzzle game. These bugs affect core game mechanics (endless mode game over, combo system, score calculation), objective tracking (ice and career mode), reward systems, mobile UI responsiveness, drag-and-drop functionality, user feedback, and navigation consistency.

## Glossary

- **Game_Store**: The Zustand store managing game state including grid, pieces, score, moves, and game mode
- **Endless_Mode**: Game mode where movesLeft is set to 999 and game continues until no pieces can be placed
- **Career_Mode**: Story-based game mode with level objectives and move limits
- **Timed_Mode**: Game mode with a countdown timer where clearing lines adds time
- **Combo_Counter**: Tracks consecutive line clears; should reset when no lines are cleared
- **Ice_Objective**: Level objective requiring player to break a certain number of ice blocks
- **Reward_Flux**: Bonus flux points awarded upon level completion
- **Piece_Tray**: UI component displaying available pieces at bottom of screen
- **HUD**: Heads-up display showing score, objectives, flux meter, and skills
- **Drag_Overlay**: Visual component showing the piece being dragged by the user
- **Shatter_Skill**: Active skill allowing player to destroy a single block
- **Bomb_Skill**: Active skill allowing player to destroy a 3x3 area
- **Game_Over_Screen**: Modal displayed when game ends showing final score and options
- **Main_Menu**: Home screen with navigation to different game modes and features
- **Level_Map**: Screen showing available career mode levels

## Requirements

### Requirement 1: Endless Mode Game Over Detection

**User Story:** As a player in endless mode, I want the game to end when I can no longer place any pieces, so that I can see my final score and try again.

#### Acceptance Criteria

1. WHEN endless mode is initialized, THE Game_Store SHALL set movesLeft to 999
2. WHEN checking for game over in endless mode, THE Game_Store SHALL ignore the movesLeft value
3. WHEN no pieces can be placed anywhere on the grid, THE Game_Store SHALL set isGameOver to true
4. WHEN isGameOver becomes true in endless mode, THE Game_Over_Screen SHALL display with the final score

### Requirement 2: Combo Counter Reset

**User Story:** As a player, I want the combo counter to reset when I place a piece that doesn't clear any lines, so that the combo system works correctly and rewards consecutive clears.

#### Acceptance Criteria

1. WHEN a piece is placed and lines are cleared, THE Game_Store SHALL increment the combo counter
2. WHEN a piece is placed and no lines are cleared, THE Game_Store SHALL reset the combo counter to zero
3. WHEN the combo counter changes, THE HUD SHALL display the updated combo value
4. WHEN combo is reset to zero, THE Game_Store SHALL not apply combo multipliers to score calculations

### Requirement 3: Career Mode Score Calculation

**User Story:** As a player in career mode, I want my score objective to be calculated correctly, so that I can complete levels fairly.

#### Acceptance Criteria

1. WHEN a piece is placed in career mode, THE Game_Store SHALL calculate the new score before updating objectives
2. WHEN updating the SCORE objective, THE Game_Store SHALL use the newly calculated score value
3. WHEN the SCORE objective is updated, THE objective current value SHALL accurately reflect the player's actual score
4. WHEN all objectives including SCORE are met, THE Game_Store SHALL mark the level as complete

### Requirement 4: Ice Objective Tracking

**User Story:** As a player with an ice-breaking objective, I want the game to track how many ice blocks I've broken, so that I can complete ice-related level objectives.

#### Acceptance Criteria

1. WHEN an ice block is cleared from the grid, THE Game_Store SHALL increment an ice broken counter
2. WHEN the ice broken counter changes, THE Game_Store SHALL update any ICE objectives
3. WHEN the ICE objective current value reaches the target, THE objective SHALL be marked as complete
4. WHEN ice blocks take damage but are not destroyed, THE Game_Store SHALL not increment the ice broken counter

### Requirement 5: Reward Flux Application

**User Story:** As a player completing a level, I want to receive the reward flux specified for that level, so that I can use abilities in future levels.

#### Acceptance Criteria

1. WHEN a level is marked as complete, THE Game_Store SHALL retrieve the rewardFlux value from the level definition
2. WHEN rewardFlux is retrieved, THE Game_Store SHALL add it to the current flux value
3. WHEN flux is updated with the reward, THE flux value SHALL not exceed the maximum of 100
4. WHEN the player proceeds to the next level, THE updated flux value SHALL persist

### Requirement 6: Mobile Piece Tray Layout

**User Story:** As a mobile player, I want the piece tray to not overlap with the HUD, so that I can see all game information clearly.

#### Acceptance Criteria

1. WHEN the viewport width is less than 768 pixels, THE Piece_Tray SHALL use mobile-optimized spacing
2. WHEN the Piece_Tray is rendered on small screens, THE tray height SHALL not cause overlap with the HUD
3. WHEN the screen orientation changes, THE Piece_Tray SHALL adjust its layout to prevent overlap
4. WHEN both HUD and Piece_Tray are visible, THE grid area SHALL have sufficient space between them

### Requirement 7: Drag Offset Consistency

**User Story:** As a mobile player, I want the dragged piece to align correctly with my finger position, so that I can accurately place pieces on the grid.

#### Acceptance Criteria

1. WHEN a piece is dragged on mobile, THE Drag_Overlay SHALL calculate yOffset based on screen height
2. WHEN the yOffset is calculated, THE Grid SHALL use the same yOffset value for hit detection
3. WHEN screen size changes, THE yOffset SHALL be recalculated to maintain alignment
4. WHEN the user drags a piece, THE visual position SHALL match the grid placement preview

### Requirement 8: Single Placement Event

**User Story:** As a player, I want each piece placement to happen exactly once, so that pieces are not placed multiple times causing game state corruption.

#### Acceptance Criteria

1. WHEN a pointerup event occurs on the canvas, THE Grid SHALL handle piece placement
2. WHEN a pointerup event occurs on the window, THE Grid SHALL handle piece placement only if not already handled
3. WHEN piece placement is attempted, THE Game_Store SHALL validate the placement before applying it
4. WHEN a piece is successfully placed, THE dragged piece state SHALL be cleared to prevent duplicate placements

### Requirement 9: Skill Visual Feedback

**User Story:** As a player using skills, I want to see which cells will be affected, so that I can make informed decisions about skill usage.

#### Acceptance Criteria

1. WHEN Shatter_Skill is activated, THE Grid SHALL highlight all filled cells on hover
2. WHEN Bomb_Skill is activated, THE Grid SHALL highlight a 3x3 area centered on the hovered cell
3. WHEN a skill is active and the mouse moves, THE highlighted cells SHALL update in real-time
4. WHEN a skill is deactivated or used, THE cell highlighting SHALL be removed

### Requirement 10: Personalized Game Over Screen

**User Story:** As a player, I want the game over screen to show mode-specific information, so that I understand why the game ended and what I achieved.

#### Acceptance Criteria

1. WHEN game over occurs in endless mode, THE Game_Over_Screen SHALL display "No More Moves" as the reason
2. WHEN game over occurs in timed mode, THE Game_Over_Screen SHALL display "Time's Up" as the reason
3. WHEN game over occurs in career mode, THE Game_Over_Screen SHALL display the specific failure reason (moves or objectives)
4. WHEN the Game_Over_Screen is displayed, THE screen SHALL show mode-specific statistics and achievements

### Requirement 11: Navigation Consistency

**User Story:** As a player, I want clear and non-conflicting navigation options, so that I can easily access different game modes without confusion.

#### Acceptance Criteria

1. WHEN the Main_Menu is displayed, THE "KARİYER" button SHALL navigate to the Career_Page
2. WHEN the MODES screen is displayed, THE "KARİYER" option SHALL navigate to the Level_Map
3. WHEN navigation occurs, THE button labels SHALL clearly indicate the destination
4. WHEN the user is on the Career_Page, THE navigation SHALL provide a clear path to the Level_Map
