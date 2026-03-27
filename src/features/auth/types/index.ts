import { User as FirebaseUser } from 'firebase/auth';

export type { FirebaseUser };

export interface AuthState {
  user: FirebaseUser | null;
  isAnonymous: boolean;
  isLoading: boolean;
  error: string | null;
  unsubscribeListener: (() => void) | null;
}

export interface AuthActions {
  initAuth: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  setError: (error: string | null) => void;
  cleanup: () => void;
}

export type AuthStore = AuthState & AuthActions;
