import { User as FirebaseUser } from 'firebase/auth';

export type { FirebaseUser };

export type MigrationStatus = 'pending' | 'in_progress' | 'complete' | 'failed';

export interface AuthState {
  user: FirebaseUser | null;
  isAnonymous: boolean;
  isLoading: boolean;
  error: string | null;
  migrationStatus: MigrationStatus;
  unsubscribeListener: (() => void) | null;
}

export interface AuthActions {
  initAuth: () => Promise<void>;
  upgradeToGoogleAccount: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  shouldPromptSignIn: (score: number, mode: string) => boolean;
  setMigrationStatus: (status: MigrationStatus) => void;
  setError: (error: string | null) => void;
  cleanup: () => void;
}

export type AuthStore = AuthState & AuthActions;
