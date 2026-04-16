/**
 * Bug Condition Exploration Property Test
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6**
 * 
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bugs exist
 * 
 * This test uses a scoped PBT approach to verify the concrete failing cases
 * from the bugfix requirements. It encodes the expected behavior and will validate
 * the fix when it passes after implementation.
 * 
 * GOAL: Surface counterexamples that demonstrate duplicate files and scattered structure exist
 * 
 * Expected Bugs:
 * 1. ConsentModal exists in 2 locations (src/components/ and src/app/components/)
 * 2. Hooks scattered across 2 directories (src/hooks/ and src/app/hooks/)
 * 3. i18n exists in 2 locations (src/i18n/ and src/services/i18n/)
 * 4. Utils uncategorized in flat structure (40+ files in single directory)
 * 5. Components scattered between src/components/ and src/app/components/
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

describe('Bug Condition Exploration - File Structure Cleanup', () => {
  describe('Property 1: Bug Condition - Duplicate and Scattered Files Detection', () => {
    /**
     * Bug 1.1: Component directories scattered
     * Requirements: 1.1
     */
    it('Bug 1.1: Should have only ONE component directory (not both src/components/ and src/app/components/)', () => {
      /**
       * Scoped PBT: Test the concrete failing case
       * Expected: Only one component directory should exist
       * Actual (buggy): Both src/components/ and src/app/components/ exist
       */
      fc.assert(
        fc.property(
          fc.constant(['src/components', 'src/app/components']),
          (directories) => {
            const existingDirs = directories.filter(dir => {
              try {
                return fs.existsSync(dir) && fs.statSync(dir).isDirectory();
              } catch {
                return false;
              }
            });
            
            // This assertion encodes the EXPECTED behavior
            // It will FAIL on unfixed code, confirming the bug exists
            expect(existingDirs.length).toBe(1);
          }
        ),
        { numRuns: 1 } // Deterministic - run once to confirm bug
      );
    });

    /**
     * Bug 1.2: ConsentModal duplicate
     * Requirements: 1.2
     */
    it('Bug 1.2: ConsentModal should exist in only ONE location (not duplicate)', () => {
      /**
       * Scoped PBT: Test the concrete failing case
       * Expected: ConsentModal should exist in only one location
       * Actual (buggy): ConsentModal exists in both src/components/ and src/app/components/
       */
      fc.assert(
        fc.property(
          fc.constant([
            'src/components/ConsentModal.tsx',
            'src/app/components/ConsentModal.tsx'
          ]),
          (possibleLocations) => {
            const existingFiles = possibleLocations.filter(file => {
              try {
                return fs.existsSync(file) && fs.statSync(file).isFile();
              } catch {
                return false;
              }
            });
            
            // This will FAIL on unfixed code
            expect(existingFiles.length).toBe(1);
          }
        ),
        { numRuns: 1 }
      );
    });

    /**
     * Bug 1.3: Hooks scattered across directories
     * Requirements: 1.3
     */
    it('Bug 1.3: Hooks should exist in only ONE directory (not scattered)', () => {
      /**
       * Scoped PBT: Test the concrete failing case
       * Expected: All hooks should be in one directory
       * Actual (buggy): Hooks scattered between src/hooks/ and src/app/hooks/
       */
      fc.assert(
        fc.property(
          fc.constant(['src/hooks', 'src/app/hooks']),
          (directories) => {
            const dirsWithHooks = directories.filter(dir => {
              try {
                if (!fs.existsSync(dir)) return false;
                const files = fs.readdirSync(dir);
                // Check if directory has any .ts or .tsx files (hooks)
                return files.some(file => 
                  (file.endsWith('.ts') || file.endsWith('.tsx')) && 
                  !file.endsWith('.test.ts') && 
                  !file.endsWith('.test.tsx')
                );
              } catch {
                return false;
              }
            });
            
            // This will FAIL on unfixed code
            expect(dirsWithHooks.length).toBe(1);
          }
        ),
        { numRuns: 1 }
      );
    });

    /**
     * Bug 1.4: i18n implementations in multiple locations
     * Requirements: 1.4
     */
    it('Bug 1.4: i18n should exist in only ONE location (not both src/i18n/ and src/services/i18n/)', () => {
      /**
       * Scoped PBT: Test the concrete failing case
       * Expected: Only one i18n implementation should exist
       * Actual (buggy): Both src/i18n/ and src/services/i18n/ exist
       */
      fc.assert(
        fc.property(
          fc.constant(['src/i18n', 'src/services/i18n']),
          (directories) => {
            const existingDirs = directories.filter(dir => {
              try {
                return fs.existsSync(dir) && fs.statSync(dir).isDirectory();
              } catch {
                return false;
              }
            });
            
            // This will FAIL on unfixed code
            expect(existingDirs.length).toBe(1);
          }
        ),
        { numRuns: 1 }
      );
    });

    /**
     * Bug 1.5: Utils uncategorized in flat structure
     * Requirements: 1.5
     */
    it('Bug 1.5: Utils should be categorized (not 40+ files in flat directory)', () => {
      /**
       * Scoped PBT: Test the concrete failing case
       * Expected: Utils should be organized in subdirectories by category
       * Actual (buggy): 40+ files in single flat src/utils/ directory
       */
      fc.assert(
        fc.property(
          fc.constant('src/utils'),
          (utilsDir) => {
            try {
              if (!fs.existsSync(utilsDir)) {
                // If utils dir doesn't exist, test passes (already fixed)
                expect(true).toBe(true);
                return;
              }

              const items = fs.readdirSync(utilsDir);
              
              // Count direct files (not subdirectories)
              const directFiles = items.filter(item => {
                const fullPath = path.join(utilsDir, item);
                try {
                  return fs.statSync(fullPath).isFile() && 
                         (item.endsWith('.ts') || item.endsWith('.tsx')) &&
                         !item.endsWith('.test.ts') && 
                         !item.endsWith('.test.tsx') &&
                         !item.endsWith('.md');
                } catch {
                  return false;
                }
              });

              // Count subdirectories (categorized structure)
              const subdirectories = items.filter(item => {
                const fullPath = path.join(utilsDir, item);
                try {
                  return fs.statSync(fullPath).isDirectory();
                } catch {
                  return false;
                }
              });

              // Expected: More subdirectories than direct files (categorized)
              // Actual (buggy): Many direct files, few/no subdirectories
              // This will FAIL on unfixed code
              expect(subdirectories.length).toBeGreaterThan(directFiles.length);
            } catch (error) {
              throw error;
            }
          }
        ),
        { numRuns: 1 }
      );
    });

    /**
     * Bug 1.6: Import path inconsistency
     * Requirements: 1.6
     */
    it('Bug 1.6: Component imports should be consistent (not scattered between multiple directories)', () => {
      /**
       * Scoped PBT: Test the concrete failing case
       * Expected: Components should have consistent import paths
       * Actual (buggy): Components can be imported from multiple locations
       */
      fc.assert(
        fc.property(
          fc.constant({
            componentDirs: ['src/components', 'src/app/components'],
            hookDirs: ['src/hooks', 'src/app/hooks'],
            i18nDirs: ['src/i18n', 'src/services/i18n']
          }),
          (structure) => {
            // Count how many duplicate directory structures exist
            let duplicateCount = 0;

            // Check component directories
            const existingComponentDirs = structure.componentDirs.filter(dir => {
              try {
                return fs.existsSync(dir) && fs.statSync(dir).isDirectory();
              } catch {
                return false;
              }
            });
            if (existingComponentDirs.length > 1) duplicateCount++;

            // Check hook directories
            const existingHookDirs = structure.hookDirs.filter(dir => {
              try {
                if (!fs.existsSync(dir)) return false;
                const files = fs.readdirSync(dir);
                return files.some(file => 
                  (file.endsWith('.ts') || file.endsWith('.tsx')) && 
                  !file.endsWith('.test.ts') && 
                  !file.endsWith('.test.tsx')
                );
              } catch {
                return false;
              }
            });
            if (existingHookDirs.length > 1) duplicateCount++;

            // Check i18n directories
            const existingI18nDirs = structure.i18nDirs.filter(dir => {
              try {
                return fs.existsSync(dir) && fs.statSync(dir).isDirectory();
              } catch {
                return false;
              }
            });
            if (existingI18nDirs.length > 1) duplicateCount++;

            // Expected: No duplicate structures (duplicateCount = 0)
            // Actual (buggy): Multiple duplicate structures exist
            // This will FAIL on unfixed code
            expect(duplicateCount).toBe(0);
          }
        ),
        { numRuns: 1 }
      );
    });
  });
});
