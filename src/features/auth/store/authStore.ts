import { create } from 'zustand';
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseFirestore } from '../../../services/firebase/config';
import { syncFromFirestore, syncLocalToFirestore } from '../../../services/firebase/syncManager';
import { detectPlatform } from '../../../services/firebase/types';
import type { AuthStore } from '../types';

export const useAuthStore = create<AuthStore>((set, get) => ({
  // State
  user: null,
  isAnonymous: false,
  isLoading: true,
  error: null,
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
        // No user - just set state, don't create anonymous user
        set({
          user: null,
          isAnonymous: false,
          isLoading: false,
          error: null,
        });
        return;
      }

      // User exists (Google login)
      set({
        user,
        isAnonymous: false,
        isLoading: false,
        error: null,
      });

      // Write user data to Firestore
      const db = getFirebaseFirestore();
      await setDoc(doc(db, 'users', user.uid), {
        schemaVersion: 2,
        displayName: user.displayName || 'Oyuncu',
        photoURL: user.photoURL || null,
        email: user.email || null,
        lastSeenAt: Date.now(),
        lastPlatform: detectPlatform(),
        lastAppVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
      }, { merge: true });

      // Sync localStorage → Firestore (migrate local scores)
      try {
        await syncLocalToFirestore(user.uid);
        console.log('initAuth: syncLocalToFirestore completed');
      } catch (error) {
        console.error('Failed to sync localStorage to Firestore:', error);
      }

      // CRITICAL: Load data from Firestore and update gameStore
      // This ensures we always show Firestore data (source of truth) for logged-in users
      try {
        const { loadUserFromFirestore } = await import('../../../services/firebase/syncManager');
        await loadUserFromFirestore(user.uid);
        console.log('initAuth: loadUserFromFirestore completed - gameStore updated from Firestore');
      } catch (error) {
        console.error('Failed to load from Firestore during auth:', error);
      }
    });
    
    // Store the unsubscribe function
    set({ unsubscribeListener: unsubscribe });
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
      });

      // Auth state listener will handle Firestore sync
    } catch (error: any) {
      console.error('Google sign in failed:', error);
      set({
        error: error.message || 'Google ile giriş başarısız oldu',
        isLoading: false,
      });
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
        unsubscribeListener: null,
      });
    } catch (error) {
      console.error('Sign out failed:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to sign out',
      });
    }
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
