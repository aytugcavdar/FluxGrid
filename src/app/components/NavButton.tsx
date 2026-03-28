import React from 'react';
import { motion } from 'framer-motion';

export interface NavButtonProps {
  icon: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
  variant?: 'default' | 'auth';
  isLoading?: boolean;
}

/**
 * NavButton Component
 * 
 * A reusable navigation button component for the bottom navigation bar.
 * Supports active/inactive states, loading skeleton, and touch feedback.
 * 
 * Optimized with React.memo to prevent unnecessary re-renders when props haven't changed.
 * 
 * **Validates: Requirements 1.3, 1.4, 3.2, 6.5**
 */
const NavButtonComponent: React.FC<NavButtonProps> = ({
  icon,
  label,
  isActive,
  onClick,
  variant = 'default',
  isLoading = false,
}) => {
  // Loading skeleton state
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          minWidth: 44,
          minHeight: 44,
          padding: '8px 4px',
          borderRadius: 8,
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          pointerEvents: 'none',
        }}
        aria-busy="true"
        aria-label="Loading"
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
            width: 40,
            height: 10,
            borderRadius: 2,
            background: 'rgba(255, 255, 255, 0.1)',
          }}
        />
      </div>
    );
  }

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <motion.button
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.15 }}
      disabled={isLoading}
      aria-label={`${label} navigation button`}
      aria-current={isActive ? 'page' : undefined}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        minWidth: 44,
        minHeight: 44,
        padding: '8px 4px',
        borderRadius: 8,
        border: '1px solid',
        borderColor: isActive ? 'rgba(0, 212, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)',
        background: variant === 'auth'
          ? isActive
            ? 'linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(0, 170, 255, 0.15))'
            : 'linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(0, 170, 255, 0.05))'
          : isActive
            ? 'rgba(0, 212, 255, 0.15)'
            : 'rgba(255, 255, 255, 0.05)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        transform: isActive ? 'scale(1.05)' : 'scale(1)',
        boxShadow: isActive
          ? '0 0 12px rgba(0, 212, 255, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2)'
          : '0 2px 4px rgba(0, 0, 0, 0.1)',
        WebkitTapHighlightColor: 'transparent',
        outline: 'none',
      }}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 212, 255, 0.5), 0 0 12px rgba(0, 212, 255, 0.3)';
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = isActive
          ? '0 0 12px rgba(0, 212, 255, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2)'
          : '0 2px 4px rgba(0, 0, 0, 0.1)';
      }}
    >
      {/* Icon */}
      <span
        aria-hidden="true"
        style={{
          fontSize: 20,
          lineHeight: 1,
          color: isActive ? '#00d4ff' : 'rgba(255, 255, 255, 0.4)',
          transition: 'color 0.2s ease',
        }}
      >
        {icon}
      </span>

      {/* Label */}
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: isActive ? '#00d4ff' : 'rgba(255, 255, 255, 0.4)',
          transition: 'color 0.2s ease',
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
    </motion.button>
  );
};

/**
 * Custom comparison function for React.memo
 * Prevents re-renders when props haven't meaningfully changed
 */
const arePropsEqual = (
  prevProps: NavButtonProps,
  nextProps: NavButtonProps
): boolean => {
  return (
    prevProps.icon === nextProps.icon &&
    prevProps.label === nextProps.label &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.variant === nextProps.variant &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.onClick === nextProps.onClick
  );
};

/**
 * Memoized NavButton component
 * Prevents unnecessary re-renders when parent components update
 */
export const NavButton = React.memo(NavButtonComponent, arePropsEqual);
