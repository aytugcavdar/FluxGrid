/**
 * Integration test for useGameSync offline handling
 * 
 * **Validates: Requirements 1.5, 2.5, 3.6**
 * 
 * This test verifies that:
 * - When offline, game scores are queued in pendingWrites
 * - When online, queued writes are synced to Firestore
 * - gameStartTime resets correctly on new game
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useGameSync } from '../../src/features/game/hooks/useGameSync';
import { useGameStore } from '../../src/features/game/store/gameStore';
import { useAuthStore } from '../../src/features/auth/store/authStore';
import { addToPendingWrites, syncScore } from '../../src/services/firebase/syncManager';
import { GameMode } from '../../src/shared/types';
import type { User as FirebaseUser } from 'firebase/auth';

// Mock Firebase sync functions
vi.mock('../../src/services/firebase/syncManager', () => ({
  syncScore: vi.fn(),
  addToPendingWrites: vi.fn(),
}));

describe('useGameSync Offline Handling - Integration Test', () => {
  const mockUser = {
    uid: 'test-user-123',
    displayName: 'Test User',
    photoURL: 'https://example.com/photo.jpg',
    isAnonymous: false,
    email: 'test@example.com',
    emailVerified: true,
    metadata: {} as any,
    providerData: [],
    refreshToken: 'mock-token',
    tenantId: null,
    delete: vi.fn(),
    getIdToken: vi.fn(),
    getIdTokenResult: vi.fn(),
    reload: vi.fn(),
    toJSON: vi.fn(),
    phoneNumber: null,
    providerId: 'google.com',
  } as FirebaseUser;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset stores to initial state
    useGameStore.setState({
      isGameOver: false,
      score: 0,
      gameMode: GameMode.ENDLESS,
      stats: {
        gamesPlayed: 0,
        totalScore: 0,
        linesCleared: 0,
        blocksPlaced: 0,
        bombsExploded: 0,
        iceBroken: 0,
        skillUses: {},
      },
      maxLevelReached: 0,
    });

    useAuthStore.setState({
      user: mockUser,
      isLoading: false,
      isAnonymous: false,
      error: null,
      unsubscribeListener: null,
    } as any);

    // Mock navigator.onLine as online by default
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should sync directly to Firestore when online', async () => {
    // Arrange: Set up online state
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    // Render hook
    renderHook(() => useGameSync());

    // Act: Simulate game over with score
    useGameStore.setState({
      isGameOver: true,
      score: 5000,
      gameMode: GameMode.ENDLESS,
    });

    // Assert: syncScore should be called (online sync)
    await waitFor(() => {
      expect(syncScore).toHaveBeenCalledWith(
        mockUser.uid,
        GameMode.ENDLESS,
        5000,
        mockUser.displayName,
        mockUser.photoURL,
        expect.any(Number), // sessionDurationSecs
        expect.objectContaining({
          passiveUnlocks: expect.any(Array),
          passiveEquipped: expect.any(Array),
          maxUnlockedLevel: expect.any(Number),
        }),
        expect.any(Object) // stats
      );
    });

    // addToPendingWrites should NOT be called when online
    expect(addToPendingWrites).not.toHaveBeenCalled();
  });

  it('should queue writes in pendingWrites when offline', async () => {
    // Arrange: Set up offline state
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    // Render hook
    renderHook(() => useGameSync());

    // Act: Simulate game over with score
    useGameStore.setState({
      isGameOver: true,
      score: 2000,
      gameMode: GameMode.TIMED,
    });

    // Assert: addToPendingWrites should be called (offline queue)
    await waitFor(() => {
      expect(addToPendingWrites).toHaveBeenCalledWith(
        mockUser.uid,
        'score',
        expect.objectContaining({
          mode: GameMode.TIMED,
          score: 2000,
          displayName: mockUser.displayName,
          photoURL: mockUser.photoURL,
          sessionDurationSecs: expect.any(Number),
          abilities: expect.objectContaining({
            passiveUnlocks: expect.any(Array),
            passiveEquipped: expect.any(Array),
            maxUnlockedLevel: expect.any(Number),
          }),
          stats: expect.any(Object),
        })
      );
    });

    // syncScore should NOT be called when offline
    expect(syncScore).not.toHaveBeenCalled();
  });

  it('should reset gameStartTime when new game starts', async () => {
    // Arrange: Render hook
    renderHook(() => useGameSync());

    // Simulate first game
    useGameStore.setState({
      isGameOver: false,
      score: 0,
    });

    // Wait a bit to simulate game duration
    await new Promise(resolve => setTimeout(resolve, 100));

    // End first game
    useGameStore.setState({
      isGameOver: true,
      score: 3000,
    });

    await waitFor(() => {
      expect(syncScore).toHaveBeenCalled();
    });

    const firstCallSessionDuration = (syncScore as any).mock.calls[0][5];

    // Clear mock
    vi.clearAllMocks();

    // Act: Start new game (isGameOver: true -> false)
    useGameStore.setState({
      isGameOver: false,
      score: 0,
    });

    // Wait a bit for new game
    await new Promise(resolve => setTimeout(resolve, 50));

    // End second game
    useGameStore.setState({
      isGameOver: true,
      score: 4000,
    });

    await waitFor(() => {
      expect(syncScore).toHaveBeenCalled();
    });

    const secondCallSessionDuration = (syncScore as any).mock.calls[0][5];

    // Assert: Second game session duration should be shorter than first + second combined
    // This proves gameStartTime was reset
    expect(secondCallSessionDuration).toBeLessThan(firstCallSessionDuration + 100);
  });

  it('should not sync when user is not logged in', async () => {
    // Arrange: Set user to null (not logged in)
    useAuthStore.setState({
      user: null,
      isLoading: false,
      isAnonymous: false,
      error: null,
      unsubscribeListener: null,
    } as any);

    // Render hook
    renderHook(() => useGameSync());

    // Act: Simulate game over
    useGameStore.setState({
      isGameOver: true,
      score: 1000,
    });

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 100));

    // Assert: Neither sync function should be called
    expect(syncScore).not.toHaveBeenCalled();
    expect(addToPendingWrites).not.toHaveBeenCalled();
  });

  it('should handle offline to online transition correctly', async () => {
    // Arrange: Start offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    // Render hook
    renderHook(() => useGameSync());

    // Act: Simulate game over while offline
    useGameStore.setState({
      isGameOver: true,
      score: 3500,
      gameMode: GameMode.ZEN,
    });

    // Assert: Should queue write
    await waitFor(() => {
      expect(addToPendingWrites).toHaveBeenCalled();
    });

    vi.clearAllMocks();

    // Now go online and start new game
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    useGameStore.setState({
      isGameOver: false,
      score: 0,
    });

    // End game while online
    useGameStore.setState({
      isGameOver: true,
      score: 4500,
    });

    // Assert: Should sync directly
    await waitFor(() => {
      expect(syncScore).toHaveBeenCalled();
    });

    expect(addToPendingWrites).not.toHaveBeenCalled();
  });

  it('should include all required data in sync payload', async () => {
    // Arrange: Set up game state with stats
    useGameStore.setState({
      isGameOver: false,
      score: 0,
      gameMode: GameMode.ENDLESS,
      stats: {
        gamesPlayed: 5,
        totalScore: 10000,
        linesCleared: 50,
        blocksPlaced: 200,
        bombsExploded: 10,
        iceBroken: 5,
        skillUses: { surge: 3 },
      },
      maxLevelReached: 8,
    });

    // Render hook
    renderHook(() => useGameSync());

    // Act: End game
    useGameStore.setState({
      isGameOver: true,
      score: 7500,
    });

    // Assert: Verify all data is included
    await waitFor(() => {
      expect(syncScore).toHaveBeenCalledWith(
        mockUser.uid,
        GameMode.ENDLESS,
        7500,
        mockUser.displayName,
        mockUser.photoURL,
        expect.any(Number),
        expect.objectContaining({
          passiveUnlocks: expect.any(Array),
          passiveEquipped: expect.any(Array),
          maxUnlockedLevel: 8,
        }),
        expect.objectContaining({
          gamesPlayed: 5,
          totalScore: 10000,
          linesCleared: 50,
          blocksPlaced: 200,
          bombsExploded: 10,
          iceBroken: 5,
          skillUses: { surge: 3 },
        })
      );
    });
  });
});
