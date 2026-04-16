/**
 * Tooltip Component
 * 
 * Contextual tooltip system that appears when users first interact with specific features.
 * Helps users discover features and understand their purpose.
 * 
 * Requirements: 8.2
 * 
 * Features:
 * - Show tooltips on first feature interaction
 * - Track shown tooltips in localStorage
 * - Dismissible tooltips
 * - Reset capability for testing
 * - Positioned near target elements
 * - Follows existing tutorial system patterns
 * 
 * Usage:
 * ```tsx
 * import { Tooltip, useTooltipStore } from '@/components/Tooltip';
 * 
 * // Show tooltip on first ability use
 * const { showTooltip, hasShownTooltip } = useTooltipStore();
 * 
 * if (!hasShownTooltip('ability_rotate')) {
 *   showTooltip({
 *     id: 'ability_rotate',
 *     title: 'Rotate Ability',
 *     description: 'Rotate the current piece 90 degrees clockwise',
 *     position: { x: 100, y: 200 },
 *   });
 * }
 * 
 * // Render tooltip manager
 * <Tooltip />
 * 
 * // Reset all tooltips (for testing)
 * const { resetAllTooltips } = useTooltipStore();
 * resetAllTooltips();
 * ```
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { create } from 'zustand';

// ============================================================================
// TYPES
// ============================================================================

export interface TooltipPosition {
  x: number;
  y: number;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

export interface TooltipData {
  id: string;
  title: string;
  description: string;
  position: TooltipPosition;
  duration?: number; // Auto-dismiss after ms (0 = manual dismiss only)
  icon?: string; // Emoji or icon
}

interface TooltipStore {
  // State
  currentTooltip: TooltipData | null;
  shownTooltips: Set<string>;
  
  // Actions
  showTooltip: (tooltip: TooltipData) => void;
  hideTooltip: () => void;
  hasShownTooltip: (id: string) => boolean;
  markAsShown: (id: string) => void;
  resetAllTooltips: () => void;
  resetTooltip: (id: string) => void;
}

// ============================================================================
// LOCALSTORAGE HELPERS
// ============================================================================

const TOOLTIP_STORAGE_KEY = 'flux_tooltips_shown_v1';

const loadShownTooltips = (): Set<string> => {
  try {
    const stored = localStorage.getItem(TOOLTIP_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return new Set(Array.isArray(parsed) ? parsed : []);
    }
  } catch (error) {
    console.error('[Tooltip] Failed to load shown tooltips', error);
  }
  return new Set();
};

const saveShownTooltips = (tooltips: Set<string>): void => {
  try {
    localStorage.setItem(TOOLTIP_STORAGE_KEY, JSON.stringify(Array.from(tooltips)));
  } catch (error) {
    console.error('[Tooltip] Failed to save shown tooltips', error);
  }
};

// ============================================================================
// ZUSTAND STORE
// ============================================================================

export const useTooltipStore = create<TooltipStore>((set, get) => ({
  currentTooltip: null,
  shownTooltips: loadShownTooltips(),
  
  showTooltip: (tooltip: TooltipData) => {
    const { shownTooltips, hasShownTooltip } = get();
    
    // Don't show if already shown (unless explicitly reset)
    if (hasShownTooltip(tooltip.id)) {
      console.log(`[Tooltip] Tooltip "${tooltip.id}" already shown, skipping`);
      return;
    }
    
    console.log(`[Tooltip] Showing tooltip: ${tooltip.id}`);
    set({ currentTooltip: tooltip });
    
    // Mark as shown
    const newShownTooltips = new Set(shownTooltips);
    newShownTooltips.add(tooltip.id);
    set({ shownTooltips: newShownTooltips });
    saveShownTooltips(newShownTooltips);
    
    // Auto-dismiss if duration specified
    if (tooltip.duration && tooltip.duration > 0) {
      setTimeout(() => {
        const current = get().currentTooltip;
        if (current?.id === tooltip.id) {
          get().hideTooltip();
        }
      }, tooltip.duration);
    }
  },
  
  hideTooltip: () => {
    console.log('[Tooltip] Hiding tooltip');
    set({ currentTooltip: null });
  },
  
  hasShownTooltip: (id: string) => {
    return get().shownTooltips.has(id);
  },
  
  markAsShown: (id: string) => {
    const { shownTooltips } = get();
    const newShownTooltips = new Set(shownTooltips);
    newShownTooltips.add(id);
    set({ shownTooltips: newShownTooltips });
    saveShownTooltips(newShownTooltips);
  },
  
  resetAllTooltips: () => {
    console.log('[Tooltip] Resetting all tooltips');
    try {
      localStorage.removeItem(TOOLTIP_STORAGE_KEY);
    } catch (error) {
      console.error('[Tooltip] Failed to reset tooltips', error);
    }
    set({ shownTooltips: new Set(), currentTooltip: null });
  },
  
  resetTooltip: (id: string) => {
    console.log(`[Tooltip] Resetting tooltip: ${id}`);
    const { shownTooltips } = get();
    const newShownTooltips = new Set(shownTooltips);
    newShownTooltips.delete(id);
    set({ shownTooltips: newShownTooltips });
    saveShownTooltips(newShownTooltips);
  },
}));

// ============================================================================
// TOOLTIP COMPONENT
// ============================================================================

interface TooltipProps {
  tooltip: TooltipData;
  onDismiss: () => void;
}

const TooltipContent: React.FC<TooltipProps> = ({ tooltip, onDismiss }) => {
  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
  
  // Calculate position based on placement
  const getPositionStyle = (): React.CSSProperties => {
    const { x, y, placement = 'center' } = tooltip.position;
    
    const baseStyle: React.CSSProperties = {
      position: 'fixed',
      zIndex: 10000,
      maxWidth: 'min(320px, 85vw)',
    };
    
    switch (placement) {
      case 'top':
        return {
          ...baseStyle,
          left: `${x}px`,
          bottom: `calc(100vh - ${y}px + 12px)`,
          transform: 'translateX(-50%)',
        };
      case 'bottom':
        return {
          ...baseStyle,
          left: `${x}px`,
          top: `${y + 12}px`,
          transform: 'translateX(-50%)',
        };
      case 'left':
        return {
          ...baseStyle,
          right: `calc(100vw - ${x}px + 12px)`,
          top: `${y}px`,
          transform: 'translateY(-50%)',
        };
      case 'right':
        return {
          ...baseStyle,
          left: `${x + 12}px`,
          top: `${y}px`,
          transform: 'translateY(-50%)',
        };
      case 'center':
      default:
        return {
          ...baseStyle,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        };
    }
  };
  
  // Animation variants
  const containerVariants = prefersReducedMotion
    ? undefined
    : {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1 },
      };
  
  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.2, ease: 'easeOut' as const };
  
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      transition={transition}
      style={getPositionStyle()}
    >
      <div
        style={{
          background: 'rgba(10, 14, 26, 0.97)',
          border: '1px solid rgba(59, 130, 246, 0.6)',
          borderRadius: '12px',
          padding: '14px 16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.2)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Title with optional icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '6px',
          }}
        >
          {tooltip.icon && (
            <span style={{ fontSize: '18px' }}>{tooltip.icon}</span>
          )}
          <div
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: 'white',
              flex: 1,
            }}
          >
            {tooltip.title}
          </div>
          
          {/* Dismiss button */}
          <button
            onClick={onDismiss}
            aria-label="Kapat"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.5)',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '0',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
            }}
          >
            ×
          </button>
        </div>
        
        {/* Description */}
        <div
          style={{
            fontSize: '13px',
            color: 'rgba(255,255,255,0.7)',
            lineHeight: '1.4',
          }}
        >
          {tooltip.description}
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// TOOLTIP MANAGER
// ============================================================================

/**
 * Tooltip manager component that renders active tooltips.
 * Should be placed at the root level of your app.
 */
export const Tooltip: React.FC = () => {
  const { currentTooltip, hideTooltip } = useTooltipStore();
  
  return (
    <AnimatePresence>
      {currentTooltip && (
        <TooltipContent
          key={currentTooltip.id}
          tooltip={currentTooltip}
          onDismiss={hideTooltip}
        />
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default Tooltip;

/**
 * Tooltip API
 * 
 * Provides programmatic access to tooltip functionality.
 */
export const TooltipAPI = {
  /**
   * Show a tooltip (if not already shown).
   */
  show: (tooltip: TooltipData) => {
    useTooltipStore.getState().showTooltip(tooltip);
  },
  
  /**
   * Hide the current tooltip.
   */
  hide: () => {
    useTooltipStore.getState().hideTooltip();
  },
  
  /**
   * Check if a tooltip has been shown.
   */
  hasShown: (id: string) => {
    return useTooltipStore.getState().hasShownTooltip(id);
  },
  
  /**
   * Mark a tooltip as shown without displaying it.
   */
  markAsShown: (id: string) => {
    useTooltipStore.getState().markAsShown(id);
  },
  
  /**
   * Reset all tooltips (for testing).
   */
  resetAll: () => {
    useTooltipStore.getState().resetAllTooltips();
  },
  
  /**
   * Reset a specific tooltip.
   */
  reset: (id: string) => {
    useTooltipStore.getState().resetTooltip(id);
  },
};
