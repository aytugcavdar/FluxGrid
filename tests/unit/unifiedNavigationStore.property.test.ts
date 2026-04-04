import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { useUnifiedNavigationStore } from '../../src/shared/store/unifiedNavigationStore';
import type { AppScreen } from '../../src/shared/store/unifiedNavigationStore';

/**
 * Property 12: Back Button Navigation Behavior
 * 
 * Validates Requirements 4.2, 4.3, 4.4, 4.5:
 * - 4.2: Home screen back press exits app
 * - 4.3: Game screen back press navigates to home
 * - 4.4: Statistics screen back press navigates to home
 * - 4.5: Settings screen back press navigates to home
 */

describe('Property 12: Back Button Navigation Behavior', () => {
  const resetStore = () => {
    // Reset store to initial state by directly setting state
    useUnifiedNavigationStore.setState({
      currentScreen: 'home',
      previousScreen: null,
      canGoBack: false,
    });
  };

  beforeEach(() => {
    resetStore();
  });

  afterEach(() => {
    resetStore();
  });

  it('Property: handleBackButton on home screen always returns false (exit app)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<AppScreen>('game', 'statistics', 'settings'),
        (intermediateScreen) => {
          const store = useUnifiedNavigationStore.getState();
          
          // Navigate to intermediate screen then back to home
          store.navigateTo(intermediateScreen);
          store.navigateTo('home');
          
          // Back button on home should return false (exit app)
          const result = store.handleBackButton();
          
          expect(result).toBe(false);
          expect(store.currentScreen).toBe('home');
        }
      ),
      { numRuns: 100, endOnFailure: true }
    );
  });

  it('Property: handleBackButton on non-home screens always navigates to home and returns true', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<AppScreen>('game', 'statistics', 'settings'),
        (screen) => {
          const store = useUnifiedNavigationStore.getState();
          
          // Navigate to non-home screen
          store.navigateTo(screen);
          
          // Back button should navigate to home and return true
          const result = store.handleBackButton();
          
          expect(result).toBe(true);
          expect(store.currentScreen).toBe('home');
        }
      ),
      { numRuns: 100, endOnFailure: true }
    );
  });

  it('Property: Navigation sequence always maintains previousScreen tracking', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom<AppScreen>('home', 'game', 'statistics', 'settings'), {
          minLength: 2,
          maxLength: 10,
        }),
        (navigationSequence) => {
          // Reset for each property run
          resetStore();
          
          for (const screen of navigationSequence) {
            const store = useUnifiedNavigationStore.getState();
            const currentBefore = store.currentScreen;
            
            store.navigateTo(screen);
            
            // If screen changed, previousScreen should be updated to what currentScreen WAS
            if (currentBefore !== screen) {
              const storeAfter = useUnifiedNavigationStore.getState();
              expect(storeAfter.previousScreen).toBe(currentBefore);
              expect(storeAfter.currentScreen).toBe(screen);
            }
            // If screen didn't change, state remains unchanged (early return in navigateTo)
          }
          
          return true;
        }
      ),
      { numRuns: 100, endOnFailure: true }
    );
  });

  it('Property: canGoBack is true if and only if currentScreen is not home', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<AppScreen>('home', 'game', 'statistics', 'settings'),
        (screen) => {
          const store = useUnifiedNavigationStore.getState();
          
          // Only navigate if different from current screen
          if (store.currentScreen !== screen) {
            store.navigateTo(screen);
          }
          
          // Check canGoBack matches screen type
          const expectedCanGoBack = store.currentScreen !== 'home';
          expect(store.canGoBack).toBe(expectedCanGoBack);
        }
      ),
      { numRuns: 100, endOnFailure: true }
    );
  });

  it('Property: goBack always navigates to home regardless of current screen', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<AppScreen>('game', 'statistics', 'settings'),
        (screen) => {
          const store = useUnifiedNavigationStore.getState();
          
          // Navigate to non-home screen
          store.navigateTo(screen);
          
          // Call goBack
          store.goBack();
          
          // Should always end up on home
          expect(store.currentScreen).toBe('home');
          expect(store.canGoBack).toBe(false);
        }
      ),
      { numRuns: 100, endOnFailure: true }
    );
  });

  it('Property: Navigating to the same screen is idempotent', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<AppScreen>('home', 'game', 'statistics', 'settings'),
        fc.integer({ min: 1, max: 5 }),
        (screen, repeatCount) => {
          const store = useUnifiedNavigationStore.getState();
          
          // First navigation (from home to target screen)
          store.navigateTo(screen);
          const stateAfterFirst = {
            currentScreen: store.currentScreen,
            previousScreen: store.previousScreen,
            canGoBack: store.canGoBack,
          };
          
          // Repeat navigation to same screen
          for (let i = 0; i < repeatCount; i++) {
            store.navigateTo(screen);
          }
          
          // State should be unchanged after repeated navigation to same screen
          expect(store.currentScreen).toBe(stateAfterFirst.currentScreen);
          expect(store.previousScreen).toBe(stateAfterFirst.previousScreen);
          expect(store.canGoBack).toBe(stateAfterFirst.canGoBack);
        }
      ),
      { numRuns: 100, endOnFailure: true }
    );
  });

  it('Property: Back button behavior is deterministic for any navigation path', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom<AppScreen>('home', 'game', 'statistics', 'settings'), {
          minLength: 1,
          maxLength: 5,
        }),
        (navigationPath) => {
          // Reset for each property run
          resetStore();
          
          // Execute navigation path
          for (const screen of navigationPath) {
            const store = useUnifiedNavigationStore.getState();
            store.navigateTo(screen);
          }
          
          const store = useUnifiedNavigationStore.getState();
          const finalScreen = store.currentScreen;
          const backResult = store.handleBackButton();
          
          // Verify deterministic behavior based on final screen
          if (finalScreen === 'home') {
            // On home: back button returns false (exit app)
            expect(backResult).toBe(false);
            expect(useUnifiedNavigationStore.getState().currentScreen).toBe('home');
          } else {
            // On other screens: back button returns true and navigates to home
            expect(backResult).toBe(true);
            expect(useUnifiedNavigationStore.getState().currentScreen).toBe('home');
          }
        }
      ),
      { numRuns: 100, endOnFailure: true }
    );
  });
});
