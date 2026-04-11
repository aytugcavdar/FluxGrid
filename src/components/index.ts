/**
 * Error Handling Components
 * 
 * Centralized exports for error boundary, recovery UI, and hooks.
 * 
 * Requirements: 2.6, 2.9, 10.4, 10.8, 10.9
 */

export { ErrorBoundary } from './ErrorBoundary';
export {
  ErrorRecoveryModal,
  ErrorToast,
  InlineError,
  getErrorMessage,
  type ErrorRecoveryProps,
} from './ErrorRecoveryUI';
export { useErrorRecovery, type ErrorRecoveryState, type ErrorRecoveryActions } from './useErrorRecovery';

/**
 * GDPR Consent Components
 * 
 * Requirements: 1.3, 1.5, 1.7
 */
export { ConsentModal, type ConsentModalProps } from './ConsentModal';

/**
 * Tutorial Components
 * 
 * Requirements: 8.1
 */
export { Tutorial, TutorialAPI, useTutorialStore, type TutorialProps } from './Tutorial';
