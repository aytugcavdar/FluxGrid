import { useEffect, useState } from 'react';
import { useAuthStore } from '@features/auth/store/authStore';
import type { FirebaseUser } from '@features/auth/types';

/**
 * Custom hook that manages auth state with a timeout mechanism.
 * Prevents flash effects by providing a timeout for auth state loading.
 * 
 * @param timeoutMs - Timeout duration in milliseconds (default: 1000ms)
 * @returns Auth state with timeout management
 * 
 * **Validates: Requirements 2.2, 2.3, 6.2, 6.3**
 */
export function useAuthWithTimeout(timeoutMs: number = 1000) {
  const [timedOut, setTimedOut] = useState(false);
  
  // Safely access auth store with error handling
  let user: FirebaseUser | null = null;
  let isAnonymous = false;
  let isLoading = true;
  let hasError = false;
  
  try {
    const authState = useAuthStore();
    user = authState.user;
    isAnonymous = authState.isAnonymous;
    isLoading = authState.isLoading;
  } catch (error) {
    // Log error to console for debugging
    console.error('Error accessing auth store:', error);
    hasError = true;
    
    // Fallback to default state on error
    user = null;
    isAnonymous = false;
    isLoading = false;
  }

  useEffect(() => {
    // If there's an error, don't set up timeout
    if (hasError) {
      return;
    }
    
    if (isLoading) {
      // Set a timeout to prevent indefinite loading state
      const timer = setTimeout(() => {
        setTimedOut(true);
      }, timeoutMs);

      // Cleanup timer when loading completes or component unmounts
      return () => clearTimeout(timer);
    } else {
      // Reset timedOut when loading completes
      setTimedOut(false);
    }
  }, [isLoading, timeoutMs, hasError]);

  return {
    user,
    isAnonymous,
    isLoading: isLoading && !timedOut && !hasError,
    timedOut,
  };
}
