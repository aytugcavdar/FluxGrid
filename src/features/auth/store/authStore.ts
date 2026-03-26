import { create } from 'zustand';
import {
  onAuthStateChanged,
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup,
  linkWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseFirestore } from '../../../services/firebase/config';
import { migrate, migrateUserToV2 } from '../../../services/firebase/migrationService';
import { syncFromFirestore } from '../../../services/firebase/syncManager';
import { DEFAULT_USER_STATS, DEFAULT_PROGRESSION, detectPlatform } from '../../../services/firebase/types';
import type { AuthStore, MigrationStatus } from '../types';

// Leaderboard thresholds for prompting sign-in
const LEADERBOARD_THRESHOLD: Record<string, number> = {
  endless: 10000,
  timed: 5000,
  blitz: 3000,
  zen: 8000,
  daily: 5000,
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  // State
  user: null,
  isAnonymous: false,
  isLoading: true,
  error: null,
  migrationStatus: 'pending',
  unsubscribeListener: null,

  // Actions
  initAuth: async () => {
    const auth = getFirebaseAuth();
    
    // Cleanup existing listener if any
    const currentUnsubscribe = get().unsubscribeListener;
    if (currentUnsubscribe) {
      currentUnsubscribe();
    }
    
    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // No user exists, create anonymous user
        try {
          const result = await signInAnonymously(auth);
          set({
            user: result.user,
            isAnonymous: true,
            isLoading: false,
            error: null,
          });

          // Write user data to Firestore
          const db = getFirebaseFirestore();
          await setDoc(doc(db, 'users', result.user.uid), {
            uid: result.user.uid,
            schemaVersion: 2,
            isAnonymous: result.user.isAnonymous,
            displayName: result.user.displayName || 'Oyuncu',
            photoURL: result.user.photoURL || null,
            createdAt: Date.now(),
            lastSeenAt: Date.now(),
            onboardingComplete: false,
            devices: {},
            highScores: {},
            stats: DEFAULT_USER_STATS,
            progression: DEFAULT_PROGRESSION,
            preferences: {
              theme: localStorage.getItem('flux_theme') || 'dark',
              language: localStorage.getItem('flux_language') || 'tr',
              muted: localStorage.getItem('flux_muted') === 'true',
            },
            lastPlatform: detectPlatform(),
            lastAppVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
          }, { merge: true });
        } catch (error) {
          console.error('Failed to create anonymous user:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to create anonymous user',
            isLoading: false,
          });
        }
      } else {
        // User exists
        set({
          user,
          isAnonymous: user.isAnonymous,
          isLoading: false,
          error: null,
        });

        // Write user data to Firestore
        const db = getFirebaseFirestore();
        await setDoc(doc(db, 'users', user.uid), {
          schemaVersion: 2,
          isAnonymous: user.isAnonymous,
          displayName: user.displayName || 'Oyuncu',
          photoURL: user.photoURL || null,
          lastSeenAt: Date.now(),
          lastPlatform: detectPlatform(),
          lastAppVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
        }, { merge: true });

        // Sync Firestore → localStorage for all users (anonymous dahil)
        try {
          await syncFromFirestore(user.uid);
        } catch (error) {
          console.error('Failed to sync from Firestore during auth:', error);
          // Don't block auth flow if sync fails
        }
        
        // Migration sadece non-anonymous için
        if (!user.isAnonymous) {
          migrateUserToV2(user.uid).catch(err => console.error('Migration failed:', err));
        }
      }
    });
    
    // Store the unsubscribe function
    set({ unsubscribeListener: unsubscribe });
  },

  upgradeToGoogleAccount: async () => {
    const auth = getFirebaseAuth();
    const currentUser = auth.currentUser;

    if (!currentUser || !currentUser.isAnonymous) {
      set({ error: 'No anonymous user to upgrade' });
      return;
    }

    try {
      set({ isLoading: true, error: null });

      // Create Google provider and link with popup
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      const result = await linkWithPopup(currentUser, provider);
      // result.user is now the user linked with Google account

      // Trigger migration
      set({ migrationStatus: 'in_progress' });
      
      const migrationResult = await migrate(currentUser.uid);
      
      if (migrationResult.success) {
        // Sync from Firestore after successful migration
        try {
          await syncFromFirestore(auth.currentUser?.uid || currentUser.uid);
        } catch (syncError) {
          console.error('Failed to sync after migration:', syncError);
          // Don't fail the upgrade if sync fails
        }
        
        set({
          user: auth.currentUser,
          isAnonymous: false,
          migrationStatus: 'complete',
          isLoading: false,
        });
      } else {
        set({
          user: auth.currentUser,
          isAnonymous: false,
          migrationStatus: 'failed',
          error: 'Migration completed with errors. Some data may not have been transferred.',
          isLoading: false,
        });
      }
    } catch (error: any) {
      console.error('Account upgrade failed:', error);

      if (error.code === 'auth/credential-already-in-use') {
        // User already has a Google account, merge data
        const anonymousUid = currentUser.uid;
        
        // Call migrate to merge anonymous data with existing account
        set({ migrationStatus: 'in_progress' });
        const migrationResult = await migrate(anonymousUid);
        
        if (migrationResult.success) {
          // Sync from Firestore after successful migration
          try {
            await syncFromFirestore(auth.currentUser?.uid || anonymousUid);
          } catch (syncError) {
            console.error('Failed to sync after credential merge:', syncError);
            // Don't fail the upgrade if sync fails
          }
          
          set({
            error: 'Account already exists. Data has been merged.',
            migrationStatus: 'complete',
            isLoading: false,
          });
        } else {
          set({
            error: 'Account already exists. Data merge completed with errors.',
            migrationStatus: 'failed',
            isLoading: false,
          });
        }
      } else {
        set({
          error: error.message || 'Failed to upgrade account',
          migrationStatus: 'failed',
          isLoading: false,
        });
      }
    }
  },

  signOut: async () => {
    const auth = getFirebaseAuth();
    try {
      // Cleanup listener before signing out
      const currentUnsubscribe = get().unsubscribeListener;
      if (currentUnsubscribe) {
        currentUnsubscribe();
      }
      
      await firebaseSignOut(auth);
      set({
        user: null,
        isAnonymous: false,
        error: null,
        migrationStatus: 'pending',
        unsubscribeListener: null,
      });
    } catch (error) {
      console.error('Sign out failed:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to sign out',
      });
    }
  },

  signInWithGoogle: async () => {
    const auth = getFirebaseAuth();
    
    try {
      set({ isLoading: true, error: null });

      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      const result = await signInWithPopup(auth, provider);

      set({
        user: result.user,
        isAnonymous: false,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Google sign-in failed:', error);
      set({
        error: error.message || 'Failed to sign in with Google',
        isLoading: false,
      });
    }
  },

  shouldPromptSignIn: (score: number, mode: string): boolean => {
    const { isAnonymous } = get();
    
    if (!isAnonymous) {
      return false;
    }

    // Get high score from localStorage
    const highScoreKey = `flux_highscore_${mode}`;
    const storedHighScore = localStorage.getItem(highScoreKey);
    const highScore = storedHighScore ? parseInt(storedHighScore, 10) : 0;

    // Check if this is a new high score
    const isNewHighScore = score > highScore;

    // Check if score qualifies for leaderboard
    const threshold = LEADERBOARD_THRESHOLD[mode] || 5000;
    const qualifiesForLeaderboard = score >= threshold;

    return isNewHighScore || qualifiesForLeaderboard;
  },

  setMigrationStatus: (status: MigrationStatus) => {
    set({ migrationStatus: status });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  cleanup: () => {
    // Cleanup function for unmounting
    const currentUnsubscribe = get().unsubscribeListener;
    if (currentUnsubscribe) {
      currentUnsubscribe();
      set({ unsubscribeListener: null });
    }
  },
}));
