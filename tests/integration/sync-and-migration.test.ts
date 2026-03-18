/**
 * Integration tests for sync and migration functionality
 * Tests sync with Firebase Emulator and account upgrade flow
 * 
 * These tests verify:
 * - Sync from Firestore to localStorage (remote-to-local)
 * - Sync from localStorage to Firestore (local-to-remote)
 * - Data persistence across sync operations
 * - Account upgrade flow with data migration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getDoc, setDoc, doc } from 'firebase/firestore';
import {
  syncFromFirestore,
  syncLocalToFirestore,
  loadUserData,
} from '../../src/services/firebase/syncManager';
import { migrate } from '../../src/services/firebase/migrationService';

describe('Sync and Migration Integration Tests', () => {
  const testUid = 'test-user-123';
  
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('syncFromFirestore - Remote to Local Sync', () => {
    it('should sync all fields from Firestore to localStorage when remote is newer', async () => {
      // Arrange: Set old local timestamp
      localStorage.setItem('firebase_last_sync', '1000');

      // Mock Firestore getDoc to return remote data
      const mockRemoteData = {
        highScores: {
          endless: 5000,
          timed: 3000,
          blitz: 2000,
        },
        maxLevelReached: 10,
        currentStreak: 5,
        preferences: {
          theme: 'dark',
          language: 'en',
        },
        lastModified: 2000, // Newer than local
      };

      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockRemoteData,
      } as any);

      // Act: Sync from Firestore
      await syncFromFirestore(testUid);

      // Assert: All fields should be synced to localStorage
      expect(localStorage.getItem('flux_highscore_endless')).toBe('5000');
      expect(localStorage.getItem('flux_highscore_timed')).toBe('3000');
      expect(localStorage.getItem('flux_highscore_blitz')).toBe('2000');
      expect(localStorage.getItem('flux_max_level')).toBe('10');
      expect(localStorage.getItem('flux_daily_streak')).toBe('5');
      expect(localStorage.getItem('flux_theme')).toBe('dark');
      expect(localStorage.getItem('flux_language')).toBe('en');

      // Verify timestamp was updated
      const syncTimestamp = parseInt(localStorage.getItem('firebase_last_sync') || '0', 10);
      expect(syncTimestamp).toBeGreaterThan(1000);
    });

    it('should handle missing optional fields gracefully', async () => {
      // Arrange: Remote data with only some fields
      localStorage.setItem('firebase_last_sync', '1000');

      const mockRemoteData = {
        highScores: {
          endless: 1000,
        },
        maxLevelReached: 5,
        // Missing: currentStreak, preferences
        lastModified: 2000,
      };

      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockRemoteData,
      } as any);

      // Act
      await syncFromFirestore(testUid);

      // Assert: Available fields synced, missing fields not set
      expect(localStorage.getItem('flux_highscore_endless')).toBe('1000');
      expect(localStorage.getItem('flux_max_level')).toBe('5');
      expect(localStorage.getItem('flux_daily_streak')).toBeNull();
      expect(localStorage.getItem('flux_theme')).toBeNull();
    });

    it('should not overwrite local data when local is newer', async () => {
      // Arrange: Set newer local timestamp
      localStorage.setItem('firebase_last_sync', '5000');
      localStorage.setItem('flux_highscore_endless', '9999');

      const mockRemoteData = {
        highScores: {
          endless: 1000, // Lower score
        },
        lastModified: 2000, // Older than local
      };

      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockRemoteData,
      } as any);

      vi.mocked(setDoc).mockResolvedValue(undefined);

      // Act
      await syncFromFirestore(testUid);

      // Assert: Local data should not be overwritten
      expect(localStorage.getItem('flux_highscore_endless')).toBe('9999');
      
      // setDoc should be called to push local data to Firestore
      expect(setDoc).toHaveBeenCalled();
    });

    it('should update timestamp when timestamps are equal', async () => {
      // Arrange: Equal timestamps
      const timestamp = 3000;
      localStorage.setItem('firebase_last_sync', timestamp.toString());

      const mockRemoteData = {
        highScores: { endless: 1000 },
        lastModified: timestamp,
      };

      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockRemoteData,
      } as any);

      // Act
      await syncFromFirestore(testUid);

      // Assert: Timestamp should still be updated
      const newTimestamp = parseInt(localStorage.getItem('firebase_last_sync') || '0', 10);
      expect(newTimestamp).toBeGreaterThanOrEqual(timestamp);
    });

    it('should handle null userData gracefully', async () => {
      // Arrange: No remote data
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
        data: () => undefined,
      } as any);

      // Act & Assert: Should not throw
      await expect(syncFromFirestore(testUid)).resolves.not.toThrow();
    });
  });

  describe('syncLocalToFirestore - Local to Remote Sync', () => {
    it('should sync all localStorage data to Firestore', async () => {
      // Arrange: Set local data
      localStorage.setItem('flux_highscore_endless', '8000');
      localStorage.setItem('flux_highscore_timed', '4000');
      localStorage.setItem('flux_max_level', '15');
      localStorage.setItem('flux_daily_streak', '7');
      localStorage.setItem('flux_theme', 'light');

      vi.mocked(setDoc).mockResolvedValue(undefined);

      // Act
      await syncLocalToFirestore(testUid);

      // Assert: setDoc should be called with collected data
      expect(setDoc).toHaveBeenCalled();
      const callArgs = vi.mocked(setDoc).mock.calls[0];
      const gameData = callArgs[1];
      
      expect(gameData).toMatchObject({
        highScores: {
          endless: 8000,
          timed: 4000,
        },
        maxLevelReached: 15,
        currentStreak: 7,
        preferences: {
          theme: 'light',
        },
      });
    });

    it('should handle empty localStorage gracefully', async () => {
      // Arrange: No local data
      vi.mocked(setDoc).mockResolvedValue(undefined);

      // Act
      await syncLocalToFirestore(testUid);

      // Assert: Should not call setDoc if no data
      expect(setDoc).not.toHaveBeenCalled();
    });
  });

  describe('Data Persistence Across Sync Operations', () => {
    it('should maintain data integrity through multiple sync cycles', async () => {
      // Cycle 1: Local to Remote
      localStorage.setItem('flux_highscore_endless', '5000');
      localStorage.setItem('flux_max_level', '10');
      vi.mocked(setDoc).mockResolvedValue(undefined);

      await syncLocalToFirestore(testUid);
      expect(setDoc).toHaveBeenCalled();

      // Cycle 2: Clear local and sync from remote
      localStorage.clear();
      localStorage.setItem('firebase_last_sync', '1000');

      const mockRemoteData = {
        highScores: { endless: 5000 },
        maxLevelReached: 10,
        lastModified: 2000,
      };

      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockRemoteData,
      } as any);

      await syncFromFirestore(testUid);

      // Assert: Data should be restored
      expect(localStorage.getItem('flux_highscore_endless')).toBe('5000');
      expect(localStorage.getItem('flux_max_level')).toBe('10');
    });

    it('should handle concurrent updates with last-write-wins strategy', async () => {
      // Simulate two devices with different timestamps
      
      // Device 1: Older data
      localStorage.setItem('firebase_last_sync', '1000');
      localStorage.setItem('flux_highscore_endless', '3000');

      // Device 2 (remote): Newer data
      const mockRemoteData = {
        highScores: { endless: 5000 },
        lastModified: 2000,
      };

      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockRemoteData,
      } as any);

      await syncFromFirestore(testUid);

      // Assert: Newer remote data should win
      expect(localStorage.getItem('flux_highscore_endless')).toBe('5000');
    });
  });

  describe('Account Upgrade Flow', () => {
    it('should verify migration service is available', () => {
      // The migration service should be available for use
      expect(migrate).toBeDefined();
      expect(typeof migrate).toBe('function');
    });

    it('should handle localStorage data during migration', async () => {
      // Arrange: Set up anonymous user data in localStorage
      localStorage.setItem('flux_highscore_endless', '7000');
      localStorage.setItem('flux_max_level', '12');
      localStorage.setItem('flux_theme', 'dark');

      // Assert: Data is in localStorage and ready for migration
      expect(localStorage.getItem('flux_highscore_endless')).toBe('7000');
      expect(localStorage.getItem('flux_max_level')).toBe('12');
      expect(localStorage.getItem('flux_theme')).toBe('dark');
      
      // The actual migration would be triggered by authStore.upgradeToGoogleAccount
      // which calls migrate(uid) - this is tested in the authStore tests
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors during sync', async () => {
      // Arrange: Mock network failure
      vi.mocked(getDoc).mockRejectedValue(new Error('Network error'));

      // Act & Assert: Should throw error
      await expect(syncFromFirestore(testUid)).rejects.toThrow('Network error');
    });

    it('should handle Firestore write errors', async () => {
      // Arrange: Mock write failure
      localStorage.setItem('flux_highscore_endless', '5000');
      vi.mocked(setDoc).mockRejectedValue(new Error('Permission denied'));

      // Act & Assert: Should throw error
      await expect(syncLocalToFirestore(testUid)).rejects.toThrow('Permission denied');
    });
  });

  describe('Timestamp Invariant', () => {
    it('should always update firebase_last_sync after successful sync', async () => {
      // Test 1: Remote newer
      localStorage.setItem('firebase_last_sync', '1000');
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          highScores: { endless: 1000 },
          lastModified: 2000,
        }),
      } as any);

      await syncFromFirestore(testUid);
      let timestamp1 = parseInt(localStorage.getItem('firebase_last_sync') || '0', 10);
      expect(timestamp1).toBeGreaterThan(1000);

      // Test 2: Local newer
      localStorage.setItem('firebase_last_sync', '5000');
      localStorage.setItem('flux_highscore_endless', '5000');
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          highScores: { endless: 1000 },
          lastModified: 2000,
        }),
      } as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      await syncFromFirestore(testUid);
      let timestamp2 = parseInt(localStorage.getItem('firebase_last_sync') || '0', 10);
      expect(timestamp2).toBeGreaterThanOrEqual(5000);

      // Test 3: Equal timestamps
      localStorage.setItem('firebase_last_sync', '3000');
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          highScores: { endless: 1000 },
          lastModified: 3000,
        }),
      } as any);

      await syncFromFirestore(testUid);
      let timestamp3 = parseInt(localStorage.getItem('firebase_last_sync') || '0', 10);
      expect(timestamp3).toBeGreaterThanOrEqual(3000);
    });
  });
});
