import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAuthStore } from './authStore';
import { doc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { detectPlatform } from '../../../services/firebase/types';

// Mock Firebase modules
vi.mock('firebase/auth');
vi.mock('firebase/firestore');
vi.mock('../../../services/firebase/config', () => ({
  getFirebaseAuth: vi.fn(() => ({})),
  getFirebaseFirestore: vi.fn(() => ({})),
}));
vi.mock('../../../services/firebase/types', () => ({
  DEFAULT_USER_STATS: {},
  DEFAULT_PROGRESSION: {},
  DEFAULT_ABILITIES: { passiveUnlocks: [], passiveEquipped: [], maxUnlockedLevel: 0 },
  detectPlatform: vi.fn(() => 'web'),
}));
vi.mock('../../../services/firebase/migrationService', () => ({
  migrate: vi.fn(),
  migrateUserToV2: vi.fn().mockResolvedValue(undefined),
}));

describe('authStore - Task 7.3: Update user metadata on login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    useAuthStore.setState({
      user: null,
      isAnonymous: false,
      isLoading: true,
      error: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should update lastSeenAt, lastPlatform, and lastAppVersion when user logs in', async () => {
    // Arrange
    const mockUser = {
      uid: 'test-uid-123',
      isAnonymous: false,
      displayName: 'Test User',
      photoURL: 'https://example.com/photo.jpg',
    };

    const mockSetDoc = vi.mocked(setDoc);
    const mockDetectPlatform = vi.mocked(detectPlatform);
    mockDetectPlatform.mockReturnValue('android');

    // Mock onAuthStateChanged to immediately call callback with user
    vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
      // Call callback with user
      if (typeof callback === 'function') {
        setTimeout(() => callback(mockUser as any), 0);
      }
      return vi.fn(); // Return unsubscribe function
    });

    // Mock dynamic imports
    vi.doMock('../../../services/firebase/migrationService', () => ({
      migrateLocalStorageToFirestoreV3: vi.fn().mockResolvedValue(undefined),
    }));
    vi.doMock('../../../services/firebase/syncManager', () => ({
      loadUserFromFirestore: vi.fn().mockResolvedValue(undefined),
      subscribeToUserChanges: vi.fn().mockReturnValue(vi.fn()),
    }));

    // Act
    await useAuthStore.getState().initAuth();

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 100));

    // Assert
    expect(mockSetDoc).toHaveBeenCalled();
    
    // Get the call arguments
    const setDocCalls = mockSetDoc.mock.calls;
    expect(setDocCalls.length).toBeGreaterThan(0);
    
    // Find the call that updates user metadata (not the createEmptyUserDocument call)
    const metadataUpdateCall = setDocCalls.find(call => {
      const data = call[1] as any;
      return data.lastSeenAt && data.lastPlatform && data.lastAppVersion;
    });

    expect(metadataUpdateCall).toBeDefined();
    
    if (metadataUpdateCall) {
      const [docRef, data, options] = metadataUpdateCall;
      
      // Verify lastSeenAt is updated with current timestamp
      expect(data).toHaveProperty('lastSeenAt');
      expect(typeof (data as any).lastSeenAt).toBe('number');
      expect((data as any).lastSeenAt).toBeGreaterThan(Date.now() - 1000); // Within last second
      
      // Verify lastPlatform is updated using detectPlatform()
      expect(data).toHaveProperty('lastPlatform', 'android');
      expect(mockDetectPlatform).toHaveBeenCalled();
      
      // Verify lastAppVersion is updated
      expect(data).toHaveProperty('lastAppVersion');
      expect(typeof (data as any).lastAppVersion).toBe('string');
      
      // Verify merge option is used
      expect(options).toEqual({ merge: true });
    }
  });

  it('should use detectPlatform() to determine platform', async () => {
    // Arrange
    const mockUser = {
      uid: 'test-uid-456',
      isAnonymous: false,
      displayName: 'Test User',
      photoURL: null,
    };

    const mockDetectPlatform = vi.mocked(detectPlatform);
    mockDetectPlatform.mockReturnValue('ios');

    vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
      if (typeof callback === 'function') {
        setTimeout(() => callback(mockUser as any), 0);
      }
      return vi.fn();
    });

    vi.doMock('../../../services/firebase/migrationService', () => ({
      migrateLocalStorageToFirestoreV3: vi.fn().mockResolvedValue(undefined),
    }));
    vi.doMock('../../../services/firebase/syncManager', () => ({
      loadUserFromFirestore: vi.fn().mockResolvedValue(undefined),
      subscribeToUserChanges: vi.fn().mockReturnValue(vi.fn()),
    }));

    // Act
    await useAuthStore.getState().initAuth();
    await new Promise(resolve => setTimeout(resolve, 100));

    // Assert
    expect(mockDetectPlatform).toHaveBeenCalled();
    
    const mockSetDoc = vi.mocked(setDoc);
    const metadataUpdateCall = mockSetDoc.mock.calls.find(call => {
      const data = call[1] as any;
      return data.lastPlatform === 'ios';
    });
    
    expect(metadataUpdateCall).toBeDefined();
  });

  it('should update metadata for Google users', async () => {
    // Test with Google user
    const mockGoogleUser = {
      uid: 'google-uid-789',
      isAnonymous: false,
      displayName: 'Test User',
      photoURL: 'https://example.com/photo.jpg',
      email: 'test@example.com',
    };

    const mockSetDoc = vi.mocked(setDoc);
    const mockDetectPlatform = vi.mocked(detectPlatform);
    mockDetectPlatform.mockReturnValue('web');

    vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
      if (typeof callback === 'function') {
        setTimeout(() => callback(mockGoogleUser as any), 0);
      }
      return vi.fn();
    });

    vi.doMock('../../../services/firebase/syncManager', () => ({
      syncLocalToFirestore: vi.fn().mockResolvedValue(undefined),
      syncFromFirestore: vi.fn().mockResolvedValue(undefined),
    }));

    // Act
    await useAuthStore.getState().initAuth();
    await new Promise(resolve => setTimeout(resolve, 100));

    // Assert - metadata should be updated for Google users
    const metadataUpdateCall = mockSetDoc.mock.calls.find(call => {
      const data = call[1] as any;
      return data.lastSeenAt && data.lastPlatform && data.lastAppVersion;
    });

    expect(metadataUpdateCall).toBeDefined();
    if (metadataUpdateCall) {
      const data = metadataUpdateCall[1] as any;
      expect(data.lastPlatform).toBe('web');
      expect(data.displayName).toBe('Test User');
      expect(data.email).toBe('test@example.com');
    }
  });
});

describe('authStore - Task 7.4: Add unsubscribe cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    useAuthStore.setState({
      user: null,
      isAnonymous: false,
      isLoading: true,
      error: null,
      unsubscribeListener: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should store unsubscribe function when user logs in', async () => {
    // Arrange
    const mockUser = {
      uid: 'test-uid-123',
      isAnonymous: false,
      displayName: 'Test User',
      photoURL: null,
    };

    const mockUnsubscribe = vi.fn();

    vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
      if (typeof callback === 'function') {
        setTimeout(() => callback(mockUser as any), 0);
      }
      return mockUnsubscribe;
    });

    vi.doMock('../../../services/firebase/migrationService', () => ({
      migrateLocalStorageToFirestoreV3: vi.fn().mockResolvedValue(undefined),
    }));
    vi.doMock('../../../services/firebase/syncManager', () => ({
      loadUserFromFirestore: vi.fn().mockResolvedValue(undefined),
      subscribeToUserChanges: vi.fn().mockReturnValue(vi.fn()),
    }));

    // Act
    await useAuthStore.getState().initAuth();
    await new Promise(resolve => setTimeout(resolve, 100));

    // Assert
    const state = useAuthStore.getState();
    expect(state.unsubscribeListener).toBe(mockUnsubscribe);
  });

  it('should call cleanup method to unsubscribe listener', () => {
    // Arrange
    const mockUnsubscribe = vi.fn();
    useAuthStore.setState({
      unsubscribeListener: mockUnsubscribe,
    });

    // Act
    useAuthStore.getState().cleanup();

    // Assert
    expect(mockUnsubscribe).toHaveBeenCalledOnce();
    expect(useAuthStore.getState().unsubscribeListener).toBeNull();
  });

  it('should cleanup existing listener before setting new one', async () => {
    // Arrange
    const mockOldUnsubscribe = vi.fn();
    const mockNewUnsubscribe = vi.fn();
    
    useAuthStore.setState({
      unsubscribeListener: mockOldUnsubscribe,
    });

    const mockUser = {
      uid: 'test-uid-456',
      isAnonymous: false,
      displayName: 'Test User',
      photoURL: null,
    };

    vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
      if (typeof callback === 'function') {
        setTimeout(() => callback(mockUser as any), 0);
      }
      return mockNewUnsubscribe;
    });

    vi.doMock('../../../services/firebase/migrationService', () => ({
      migrateLocalStorageToFirestoreV3: vi.fn().mockResolvedValue(undefined),
    }));
    vi.doMock('../../../services/firebase/syncManager', () => ({
      loadUserFromFirestore: vi.fn().mockResolvedValue(undefined),
      subscribeToUserChanges: vi.fn().mockReturnValue(vi.fn()),
    }));

    // Act
    await useAuthStore.getState().initAuth();
    await new Promise(resolve => setTimeout(resolve, 100));

    // Assert
    expect(mockOldUnsubscribe).toHaveBeenCalledOnce();
    expect(useAuthStore.getState().unsubscribeListener).toBe(mockNewUnsubscribe);
  });

  it('should call cleanup when signing out', async () => {
    // Arrange
    const mockUnsubscribe = vi.fn();
    useAuthStore.setState({
      user: { uid: 'test-uid' } as any,
      unsubscribeListener: mockUnsubscribe,
    });

    // Act
    await useAuthStore.getState().signOut();

    // Assert
    expect(mockUnsubscribe).toHaveBeenCalledOnce();
    expect(useAuthStore.getState().unsubscribeListener).toBeNull();
  });

  it('should handle cleanup when no listener exists', () => {
    // Arrange
    useAuthStore.setState({
      unsubscribeListener: null,
    });

    // Act & Assert - should not throw
    expect(() => useAuthStore.getState().cleanup()).not.toThrow();
    expect(useAuthStore.getState().unsubscribeListener).toBeNull();
  });
});
