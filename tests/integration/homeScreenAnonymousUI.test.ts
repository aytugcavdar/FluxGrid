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
  it('should use isAnonymous state from authStore', () => {
    // Read HomeScreen.tsx file
    const homeScreenPath = path.join(process.cwd(), 'src/app/HomeScreen.tsx');
    const homeScreenCode = fs.readFileSync(homeScreenPath, 'utf-8');

    // Check for isAnonymous state
    const hasIsAnonymous = /const\s+isAnonymous\s*=\s*useAuthStore\(state\s*=>\s*state\.isAnonymous\)/m.test(homeScreenCode);
    expect(hasIsAnonymous).toBe(true);
  });

  it('should use linkWithGoogle action from authStore', () => {
    // Read HomeScreen.tsx file
    const homeScreenPath = path.join(process.cwd(), 'src/app/HomeScreen.tsx');
    const homeScreenCode = fs.readFileSync(homeScreenPath, 'utf-8');

    // Check for linkWithGoogle action
    const hasLinkWithGoogle = /const\s+linkWithGoogle\s*=\s*useAuthStore\(state\s*=>\s*state\.linkWithGoogle\)/m.test(homeScreenCode);
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

  it('should show "HESABINI KAYDET" button for anonymous users', () => {
    // Read HomeScreen.tsx file
    const homeScreenPath = path.join(process.cwd(), 'src/app/HomeScreen.tsx');
    const homeScreenCode = fs.readFileSync(homeScreenPath, 'utf-8');

    // Check for "HESABINI KAYDET" text
    const hasHesabiniKaydet = /HESABINI KAYDET/i.test(homeScreenCode);
    expect(hasHesabiniKaydet).toBe(true);
  });

  it('should call linkWithGoogle() for anonymous users', () => {
    // Read HomeScreen.tsx file
    const homeScreenPath = path.join(process.cwd(), 'src/app/HomeScreen.tsx');
    const homeScreenCode = fs.readFileSync(homeScreenPath, 'utf-8');

    // Check for conditional linkWithGoogle call
    // Pattern: if (isAnonymous) { linkWithGoogle(); }
    const hasLinkWithGoogleCall = /if\s*\(\s*isAnonymous\s*\)\s*\{[^}]*linkWithGoogle\(\)/s.test(homeScreenCode);
    expect(hasLinkWithGoogleCall).toBe(true);
  });

  it('should show button for both anonymous and not logged in users', () => {
    // Read HomeScreen.tsx file
    const homeScreenPath = path.join(process.cwd(), 'src/app/HomeScreen.tsx');
    const homeScreenCode = fs.readFileSync(homeScreenPath, 'utf-8');

    // Check for conditional button display
    // Pattern: {(!user || isAnonymous) && ( ... button ... )}
    const hasConditionalButton = /\{\s*\(\s*!user\s*\|\|\s*isAnonymous\s*\)\s*&&/m.test(homeScreenCode);
    expect(hasConditionalButton).toBe(true);
  });

  it('should use different icon for anonymous users (💾 vs 🔐)', () => {
    // Read HomeScreen.tsx file
    const homeScreenPath = path.join(process.cwd(), 'src/app/HomeScreen.tsx');
    const homeScreenCode = fs.readFileSync(homeScreenPath, 'utf-8');

    // Check for conditional icon
    // Pattern: {isAnonymous ? '💾' : '🔐'}
    const hasConditionalIcon = /\{isAnonymous\s*\?\s*['"]💾['"]\s*:\s*['"]🔐['"]\}/m.test(homeScreenCode);
    expect(hasConditionalIcon).toBe(true);
  });

  it('should use conditional button text (HESABINI KAYDET vs GİRİŞ YAP)', () => {
    // Read HomeScreen.tsx file
    const homeScreenPath = path.join(process.cwd(), 'src/app/HomeScreen.tsx');
    const homeScreenCode = fs.readFileSync(homeScreenPath, 'utf-8');

    // Check for conditional button text
    // Pattern: {isAnonymous ? 'HESABINI KAYDET' : 'GİRİŞ YAP'}
    const hasConditionalText = /\{isAnonymous\s*\?\s*['"]HESABINI KAYDET['"]\s*:\s*['"]GİRİŞ YAP['"]\}/m.test(homeScreenCode);
    expect(hasConditionalText).toBe(true);
  });
});
