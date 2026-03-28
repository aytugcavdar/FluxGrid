import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { User } from 'firebase/auth';

export interface AuthButtonProps {
  user: User | null;
  isAnonymous: boolean;
  isLoading: boolean;
  onLogin: () => void;
  onSaveAccount: () => void;
  prefersReducedMotion?: boolean;
}

export type AuthButtonState = 
  | { type: 'loading' }
  | { type: 'login'; icon: string; label: string }
  | { type: 'save'; icon: string; label: string }
  | { type: 'hidden' };

/**
 * AuthButton Component
 * 
 * Conditional authentication button that shows different content based on user state.
 * - Loading: Shows skeleton placeholder
 * - Unauthenticated: Shows "GİRİŞ YAP" with 🔐 icon
 * - Anonymous: Shows "HESABINI KAYDET" with 💾 icon
 * - Authenticated: Hidden (returns null)
 * 
 * **Validates: Requirements 2.2, 2.3, 5.1, 5.2, 5.3**
 */
export const AuthButton: React.FC<AuthButtonProps> = ({
  user,
  isAnonymous,
  isLoading,
  onLogin,
  onSaveAccount,
  prefersReducedMotion = false,
}) => {
  // Calculate button state based on user and isAnonymous props
  const getButtonState = (): AuthButtonState => {
    if (isLoading) {
      return { type: 'loading' };
    }
    
    if (!user) {
      return { type: 'login', icon: '🛡️', label: 'SAVE' };
    }
    
    if (isAnonymous) {
      return { type: 'save', icon: '🛡️', label: 'SAVE' };
    }
    
    return { type: 'hidden' };
  };

  const buttonState = getButtonState();

  // Hidden state - don't render anything
  if (buttonState.type === 'hidden') {
    return null;
  }

  // Loading skeleton state
  if (buttonState.type === 'loading') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          minWidth: 44,
          minHeight: 44,
          padding: '12px 20px',
          borderRadius: 12,
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          pointerEvents: 'none',
        }}
        aria-busy="true"
        aria-label="Loading authentication"
        data-testid="auth-button-loading"
      >
        {/* Icon skeleton */}
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: 20,
            height: 20,
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.1)',
          }}
        />
        {/* Label skeleton */}
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }}
          style={{
            width: 60,
            height: 10,
            borderRadius: 2,
            background: 'rgba(255, 255, 255, 0.1)',
          }}
        />
      </div>
    );
  }

  // Determine click handler and content based on state
  const handleClick = buttonState.type === 'login' ? onLogin : onSaveAccount;
  const { icon, label } = buttonState;

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  // Framer Motion enter/exit animation variants
  const authButtonVariants = {
    initial: { opacity: 0, scale: prefersReducedMotion ? 1 : 0.8 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: { duration: prefersReducedMotion ? 0 : 0.3 },
    },
    exit: {
      opacity: 0,
      scale: prefersReducedMotion ? 1 : 0.8,
      transition: { duration: prefersReducedMotion ? 0 : 0.2 },
    },
  };

  return (
    <AnimatePresence mode="wait">
      <motion.button
        key={buttonState.type}
        variants={authButtonVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        whileTap={{ scale: 0.95 }}
        aria-label={`${label} navigation button`}
        data-testid="auth-button"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          minWidth: 44,
          minHeight: 44,
          padding: '12px 20px',
          borderRadius: 12,
          border: '1px solid rgba(0, 212, 255, 0.3)',
          // Gradient background for auth button variant
          background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(0, 170, 255, 0.15))',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 8px rgba(0, 212, 255, 0.2)',
          WebkitTapHighlightColor: 'transparent',
          outline: 'none',
        }}
        onFocus={(e) => {
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 212, 255, 0.5), 0 2px 8px rgba(0, 212, 255, 0.2)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 212, 255, 0.2)';
        }}
      >
        {/* Icon */}
        <span
          aria-hidden="true"
          style={{
            fontSize: 20,
            lineHeight: 1,
            color: '#00d4ff',
          }}
        >
          {icon}
        </span>

        {/* Label */}
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#00d4ff',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
      </motion.button>
    </AnimatePresence>
  );
};
