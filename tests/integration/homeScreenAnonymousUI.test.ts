/**
 * Integration Test: HomeScreen UI - Anonymous User Display
 * 
 * Purpose: Verify that HomeScreen UI correctly displays for anonymous users
 * - Shows "HESABINI KAYDET" button for anonymous users
 * - Hides rank display for anonymous users
 * 
 * Expected Outcome: Test PASSES (confirms UI updated correctly)
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('HomeScreen UI - Anonymous User Display', () => {
  it('should use isAnonymous state from authStore in HomeScreen', () => {
    // Read HomeScreen.tsx file
    const homeScreenPath = path.join(process.cwd(), 'src/app/HomeScreen.tsx');
    const homeScreenCode = fs.readFileSync(homeScreenPath, 'utf-8');

    // Check for isAnonymous state
    const hasIsAnonymous = /const\s+isAnonymous\s*=\s*useAuthStore\(state\s*=>\s*state\.isAnonymous\)/m.test(homeScreenCode);
    expect(hasIsAnonymous).toBe(true);
  });

  it('should use linkWithGoogle action from authStore in BottomNavigation', () => {
    // Read BottomNavigation.tsx file
    const bottomNavPath = path.join(process.cwd(), 'src/app/components/BottomNavigation.tsx');
    const bottomNavCode = fs.readFileSync(bottomNavPath, 'utf-8');

    // Check for linkWithGoogle action
    const hasLinkWithGoogle = /linkWithGoogle/m.test(bottomNavCode);
    expect(hasLinkWithGoogle).toBe(true);
  });

  it('should hide rank display for anonymous users', () => {
    // Read HomeScreen.tsx file
    const homeScreenPath = path.join(process.cwd(), 'src/app/HomeScreen.tsx');
    const homeScreenCode = fs.readFileSync(homeScreenPath, 'utf-8');

    // Check for conditional rank display
    // Pattern: {!isAnonymous && ( ... Sıralama ... )}
    const hasConditionalRank = /\{!isAnonymous\s*&&\s*\([\s\S]*?Sıralama/m.test(homeScreenCode);
    expect(hasConditionalRank).toBe(true);
  });

  it('should show "SAVE" button for anonymous users in AuthButton', () => {
    // Read AuthButton.tsx file
    const authButtonPath = path.join(process.cwd(), 'src/app/components/AuthButton.tsx');
    const authButtonCode = fs.readFileSync(authButtonPath, 'utf-8');

    // Check for "SAVE" text
    const hasSave = /['"]SAVE['"]/i.test(authButtonCode);
    expect(hasSave).toBe(true);
  });

  it('should call linkWithGoogle() for anonymous users in BottomNavigation', () => {
    // Read BottomNavigation.tsx file
    const bottomNavPath = path.join(process.cwd(), 'src/app/components/BottomNavigation.tsx');
    const bottomNavCode = fs.readFileSync(bottomNavPath, 'utf-8');

    // Check for handleSaveAccount that calls linkWithGoogle
    const hasHandleSaveAccount = /handleSaveAccount.*linkWithGoogle/s.test(bottomNavCode);
    expect(hasHandleSaveAccount).toBe(true);
  });

  it('should show button for both anonymous and not logged in users in BottomNavigation', () => {
    // Read BottomNavigation.tsx file
    const bottomNavPath = path.join(process.cwd(), 'src/app/components/BottomNavigation.tsx');
    const bottomNavCode = fs.readFileSync(bottomNavPath, 'utf-8');

    // Check for conditional button display
    // Pattern: isAuthButtonVisible = !user || isAnonymous
    const hasConditionalButton = /isAuthButtonVisible\s*=\s*!user\s*\|\|\s*isAnonymous/m.test(bottomNavCode);
    expect(hasConditionalButton).toBe(true);
  });

  it('should use shield icon (🛡️) for auth button in AuthButton', () => {
    // Read AuthButton.tsx file
    const authButtonPath = path.join(process.cwd(), 'src/app/components/AuthButton.tsx');
    const authButtonCode = fs.readFileSync(authButtonPath, 'utf-8');

    // Check for shield icon in the code
    const hasShieldIcon = /['"]🛡️['"]/m.test(authButtonCode);
    expect(hasShieldIcon).toBe(true);
  });

  it('should use "SAVE" button text in AuthButton', () => {
    // Read AuthButton.tsx file
    const authButtonPath = path.join(process.cwd(), 'src/app/components/AuthButton.tsx');
    const authButtonCode = fs.readFileSync(authButtonPath, 'utf-8');

    // Check for SAVE button text in the code
    const hasSave = /['"]SAVE['"]/m.test(authButtonCode);
    expect(hasSave).toBe(true);
  });
});
