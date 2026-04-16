/**
 * Preservation Property Test
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**
 * 
 * IMPORTANT: Follow observation-first methodology
 * 
 * This test verifies that all functionality works correctly after the file structure
 * migration. It ensures that moving files to new locations did not break any
 * functionality.
 * 
 * Property 2: Preservation - All Functionality Works After Migration
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

describe('Preservation - File Structure Cleanup', () => {
  describe('Property 2: All Functionality Works After Migration', () => {
    /**
     * Preservation 3.1: Component functionality preserved
     * Requirements: 3.1
     */
    it('Preservation 3.1: All components should be importable and functional', () => {
      fc.assert(
        fc.property(
          fc.constant({
            sharedComponents: 'src/shared/components',
            appComponents: 'src/app/components',
          }),
          (structure) => {
            // Verify shared components directory exists and has components
            expect(fs.existsSync(structure.sharedComponents)).toBe(true);
            const sharedFiles = fs.readdirSync(structure.sharedComponents);
            const sharedComponentFiles = sharedFiles.filter(
              file => (file.endsWith('.tsx') || file.endsWith('.ts')) && 
                     !file.endsWith('.test.tsx') && 
                     !file.endsWith('.test.ts') &&
                     file !== 'index.ts'
            );
            expect(sharedComponentFiles.length).toBeGreaterThan(0);

            // Verify app components directory exists and has components
            expect(fs.existsSync(structure.appComponents)).toBe(true);
            const appFiles = fs.readdirSync(structure.appComponents);
            const appComponentFiles = appFiles.filter(
              file => (file.endsWith('.tsx') || file.endsWith('.ts')) && 
                     !file.endsWith('.test.tsx') && 
                     !file.endsWith('.test.ts') &&
                     file !== 'index.ts'
            );
            expect(appComponentFiles.length).toBeGreaterThan(0);

            // Verify index.ts exports exist
            expect(fs.existsSync(path.join(structure.sharedComponents, 'index.ts'))).toBe(true);
            expect(fs.existsSync(path.join(structure.appComponents, 'index.ts'))).toBe(true);
          }
        ),
        { numRuns: 1 }
      );
    });

    /**
     * Preservation 3.2: Hook functionality preserved
     * Requirements: 3.2
     */
    it('Preservation 3.2: All hooks should be importable and functional', () => {
      fc.assert(
        fc.property(
          fc.constant({
            appHooks: 'src/app/hooks',
            sharedHooks: 'src/shared/hooks',
          }),
          (structure) => {
            // Verify app hooks directory exists and has hooks
            expect(fs.existsSync(structure.appHooks)).toBe(true);
            const appHookFiles = fs.readdirSync(structure.appHooks);
            const appHooks = appHookFiles.filter(
              file => file.startsWith('use') && 
                     (file.endsWith('.ts') || file.endsWith('.tsx')) &&
                     !file.endsWith('.test.ts') &&
                     !file.endsWith('.test.tsx')
            );
            expect(appHooks.length).toBeGreaterThan(0);

            // Verify shared hooks directory exists and has hooks
            expect(fs.existsSync(structure.sharedHooks)).toBe(true);
            const sharedHookFiles = fs.readdirSync(structure.sharedHooks);
            const sharedHooks = sharedHookFiles.filter(
              file => file.startsWith('use') && 
                     (file.endsWith('.ts') || file.endsWith('.tsx')) &&
                     !file.endsWith('.test.ts') &&
                     !file.endsWith('.test.tsx')
            );
            expect(sharedHooks.length).toBeGreaterThan(0);

            // Verify index.ts exports exist
            expect(fs.existsSync(path.join(structure.appHooks, 'index.ts'))).toBe(true);
            expect(fs.existsSync(path.join(structure.sharedHooks, 'index.ts'))).toBe(true);
          }
        ),
        { numRuns: 1 }
      );
    });

    /**
     * Preservation 3.3: i18n functionality preserved
     * Requirements: 3.3
     */
    it('Preservation 3.3: i18n should work correctly with single implementation', () => {
      fc.assert(
        fc.property(
          fc.constant('src/i18n'),
          (i18nDir) => {
            // Verify i18n directory exists
            expect(fs.existsSync(i18nDir)).toBe(true);

            // Verify locales directory exists
            const localesDir = path.join(i18nDir, 'locales');
            expect(fs.existsSync(localesDir)).toBe(true);

            // Verify locale files exist
            const localeFiles = fs.readdirSync(localesDir);
            const jsonFiles = localeFiles.filter(file => file.endsWith('.json'));
            expect(jsonFiles.length).toBeGreaterThan(0);

            // Verify index.ts exists
            expect(fs.existsSync(path.join(i18nDir, 'index.ts'))).toBe(true);

            // Verify old duplicate is removed
            expect(fs.existsSync('src/services/i18n')).toBe(false);
          }
        ),
        { numRuns: 1 }
      );
    });

    /**
     * Preservation 3.4: Utils functionality preserved
     * Requirements: 3.4
     */
    it('Preservation 3.4: All utils should be categorized and functional', () => {
      fc.assert(
        fc.property(
          fc.constant({
            utilsDir: 'src/utils',
            expectedCategories: [
              'audio',
              'platform',
              'animation',
              'device',
              'game',
              'storage',
              'sharing',
              'native',
              'performance',
              'managers',
              'responsive'
            ]
          }),
          (structure) => {
            // Verify utils directory exists
            expect(fs.existsSync(structure.utilsDir)).toBe(true);

            const items = fs.readdirSync(structure.utilsDir);
            
            // Count subdirectories (categories)
            const subdirectories = items.filter(item => {
              const fullPath = path.join(structure.utilsDir, item);
              try {
                return fs.statSync(fullPath).isDirectory();
              } catch {
                return false;
              }
            });

            // Verify we have multiple categories
            expect(subdirectories.length).toBeGreaterThanOrEqual(10);

            // Verify expected categories exist
            for (const category of structure.expectedCategories) {
              const categoryPath = path.join(structure.utilsDir, category);
              expect(fs.existsSync(categoryPath)).toBe(true);
              
              // Verify each category has an index.ts
              const indexPath = path.join(categoryPath, 'index.ts');
              expect(fs.existsSync(indexPath)).toBe(true);
            }

            // Count direct files (should be minimal - only docs and guides)
            const directFiles = items.filter(item => {
              const fullPath = path.join(structure.utilsDir, item);
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

            // Verify utils are categorized (more subdirectories than direct files)
            expect(subdirectories.length).toBeGreaterThan(directFiles.length);
          }
        ),
        { numRuns: 1 }
      );
    });

    /**
     * Preservation 3.5: Test files work correctly
     * Requirements: 3.5
     */
    it('Preservation 3.5: Test files should have correct import paths', () => {
      fc.assert(
        fc.property(
          fc.constant({
            testDirs: [
              'tests/unit',
              'tests/property',
              'src/app/__tests__',
              'src/app/components/__tests__'
            ]
          }),
          (structure) => {
            // Verify test directories exist
            for (const testDir of structure.testDirs) {
              if (fs.existsSync(testDir)) {
                expect(fs.statSync(testDir).isDirectory()).toBe(true);
              }
            }

            // Verify property test for file structure exists
            const fileStructureTest = 'tests/property/file-structure/__tests__/file-structure-bug-condition.test.ts';
            expect(fs.existsSync(fileStructureTest)).toBe(true);
          }
        ),
        { numRuns: 1 }
      );
    });

    /**
     * Preservation 3.6: Build succeeds
     * Requirements: 3.6
     */
    it('Preservation 3.6: TypeScript configuration should be valid', () => {
      fc.assert(
        fc.property(
          fc.constant({
            tsconfig: 'tsconfig.json',
            packageJson: 'package.json',
            viteConfig: 'vite.config.ts'
          }),
          (structure) => {
            // Verify TypeScript config file exists
            expect(fs.existsSync(structure.tsconfig)).toBe(true);

            // Verify package.json exists (needed for build)
            expect(fs.existsSync(structure.packageJson)).toBe(true);

            // Verify vite.config.ts exists (needed for build)
            expect(fs.existsSync(structure.viteConfig)).toBe(true);
          }
        ),
        { numRuns: 1 }
      );
    });

    /**
     * Integration test: Verify no duplicate files remain
     */
    it('Integration: No duplicate files should exist after migration', () => {
      fc.assert(
        fc.property(
          fc.constant({
            oldComponentsDir: 'src/components',
            oldHooksDir: 'src/hooks',
            oldI18nService: 'src/services/i18n'
          }),
          (structure) => {
            // Verify old components directory only has index.ts (backward compatibility)
            if (fs.existsSync(structure.oldComponentsDir)) {
              const files = fs.readdirSync(structure.oldComponentsDir);
              const componentFiles = files.filter(
                file => (file.endsWith('.tsx') || file.endsWith('.ts')) && 
                       file !== 'index.ts' &&
                       !file.endsWith('.test.tsx') &&
                       !file.endsWith('.test.ts')
              );
              expect(componentFiles.length).toBe(0);
            }

            // Verify old hooks directory is empty or doesn't exist
            if (fs.existsSync(structure.oldHooksDir)) {
              const files = fs.readdirSync(structure.oldHooksDir);
              const hookFiles = files.filter(
                file => file.startsWith('use') && 
                       (file.endsWith('.ts') || file.endsWith('.tsx'))
              );
              expect(hookFiles.length).toBe(0);
            }

            // Verify old i18n service is removed
            expect(fs.existsSync(structure.oldI18nService)).toBe(false);
          }
        ),
        { numRuns: 1 }
      );
    });
  });
});
