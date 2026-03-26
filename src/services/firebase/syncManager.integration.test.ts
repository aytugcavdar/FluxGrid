import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadUserFromFirestore, subscribeToUserChanges } from './syncManager';
import { PassiveAbilityType } from '@features/abilities/types';
import { DEFAULT_USER_STATS, DEFAULT_PROGRESSION, DEFAULT_ABILITIES } from './types';

// Mock Firestore
vi.mock('./config', () => ({
  getFirebaseFirestore: vi.fn(() => ({})),
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  onSnapshot: vi.fn(),
}));

describe('syncManager - passiveAbilityStore integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call initializeFromFirestore when loading user data', async () => {
    const { getDoc } = await import('firebase/firestore');
    const mockGetDoc = getDoc as any;

    // Mock Firestore document
    const mockUserData = {
      uid: 'test-uid',
      schemaVersion: 3,
      displayName: 'Test User',
      photoURL: null,
      isAnonymous: false,
      createdAt: Date.now(),
      lastSeenAt: Date.now(),
      onboardingComplete: true,
      devices: {},
      highScores: { ENDLESS: 1000 },
      stats: DEFAULT_USER_STATS,
      progression: { ...DEFAULT_PROGRESSION, maxLevelReached: 10 },
      preferences: { theme: 'dark', language: 'en', muted: false },
      abilities: {
        passiveUnlocks: [PassiveAbilityType.FLUX_BOOST],
        passiveEquipped: [PassiveAbilityType.FLUX_BOOST],
        maxUnlockedLevel: 10,
      },
      lastPlatform: 'web' as const,
      lastAppVersion: '1.0.0',
    };

    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockUserData,
    });

    // Load user data
    await loadUserFromFirestore('test-uid');

    // Verify that the stores were updated
    const { useGameStore } = await import('@features/game/store/gameStore');
    const { usePassiveAbilityStore } = await import('@features/abilities/store/passiveAbilityStore');

    const gameState = useGameStore.getState();
    const passiveState = usePassiveAbilityStore.getState();

    // Verify gameStore was updated
    expect(gameState.highScores).toEqual({ ENDLESS: 1000 });
    expect(gameState.maxLevelReached).toBe(10);

    // Verify passiveAbilityStore was updated
    const fluxBoost = passiveState.passiveAbilities.get(PassiveAbilityType.FLUX_BOOST);
    expect(fluxBoost?.unlocked).toBe(true);
    expect(fluxBoost?.equipped).toBe(true);
    expect(passiveState.equippedSlots[0]).toBe(PassiveAbilityType.FLUX_BOOST);
  });

  it('should handle missing abilities data with defaults', async () => {
    const { getDoc } = await import('firebase/firestore');
    const mockGetDoc = getDoc as any;

    // Mock Firestore document without abilities
    const mockUserData = {
      uid: 'test-uid',
      schemaVersion: 3,
      displayName: 'Test User',
      photoURL: null,
      isAnonymous: false,
      createdAt: Date.now(),
      lastSeenAt: Date.now(),
      onboardingComplete: true,
      devices: {},
      highScores: {},
      stats: DEFAULT_USER_STATS,
      progression: DEFAULT_PROGRESSION,
      preferences: { theme: 'dark', language: 'en', muted: false },
      // abilities field is missing
      lastPlatform: 'web' as const,
      lastAppVersion: '1.0.0',
    };

    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockUserData,
    });

    // Load user data
    await loadUserFromFirestore('test-uid');

    // Verify that default abilities were used
    const { usePassiveAbilityStore } = await import('@features/abilities/store/passiveAbilityStore');
    const passiveState = usePassiveAbilityStore.getState();

    // All abilities should be locked with default data
    passiveState.passiveAbilities.forEach((ability) => {
      expect(ability.unlocked).toBe(false);
      expect(ability.equipped).toBe(false);
    });
  });

  it('should update passiveAbilityStore on real-time changes', async () => {
    const { onSnapshot } = await import('firebase/firestore');
    const mockOnSnapshot = onSnapshot as any;

    let snapshotCallback: any;

    // Mock onSnapshot to capture the callback
    mockOnSnapshot.mockImplementation((docRef: any, callback: any) => {
      snapshotCallback = callback;
      return vi.fn(); // unsubscribe function
    });

    // Subscribe to changes
    const unsubscribe = subscribeToUserChanges('test-uid', () => {});

    // Simulate a Firestore update
    const mockUserData = {
      uid: 'test-uid',
      schemaVersion: 3,
      displayName: 'Test User',
      photoURL: null,
      isAnonymous: false,
      createdAt: Date.now(),
      lastSeenAt: Date.now(),
      onboardingComplete: true,
      devices: {},
      highScores: { ENDLESS: 2000 },
      stats: DEFAULT_USER_STATS,
      progression: { ...DEFAULT_PROGRESSION, maxLevelReached: 20 },
      preferences: { theme: 'dark', language: 'en', muted: false },
      abilities: {
        passiveUnlocks: [PassiveAbilityType.FLUX_BOOST, PassiveAbilityType.SCORE_MULTIPLIER],
        passiveEquipped: [PassiveAbilityType.FLUX_BOOST, PassiveAbilityType.SCORE_MULTIPLIER],
        maxUnlockedLevel: 20,
      },
      lastPlatform: 'web' as const,
      lastAppVersion: '1.0.0',
    };

    await snapshotCallback({
      exists: () => true,
      data: () => mockUserData,
    });

    // Verify that the stores were updated
    const { useGameStore } = await import('@features/game/store/gameStore');
    const { usePassiveAbilityStore } = await import('@features/abilities/store/passiveAbilityStore');

    const gameState = useGameStore.getState();
    const passiveState = usePassiveAbilityStore.getState();

    // Verify gameStore was updated
    expect(gameState.highScores).toEqual({ ENDLESS: 2000 });
    expect(gameState.maxLevelReached).toBe(20);

    // Verify passiveAbilityStore was updated
    const fluxBoost = passiveState.passiveAbilities.get(PassiveAbilityType.FLUX_BOOST);
    const scoreMultiplier = passiveState.passiveAbilities.get(PassiveAbilityType.SCORE_MULTIPLIER);
    
    expect(fluxBoost?.unlocked).toBe(true);
    expect(fluxBoost?.equipped).toBe(true);
    expect(scoreMultiplier?.unlocked).toBe(true);
    expect(scoreMultiplier?.equipped).toBe(true);
    
    expect(passiveState.equippedSlots[0]).toBe(PassiveAbilityType.FLUX_BOOST);
    expect(passiveState.equippedSlots[1]).toBe(PassiveAbilityType.SCORE_MULTIPLIER);

    unsubscribe();
  });
});
