import React from 'react';

interface EventStartVisualProps {
  eventType: 'ICE_STORM' | 'GRAVITY_RUSH' | 'QUAKE' | 'MIRROR' | 'CHAOS' | 'VOID' | null;
  onComplete?: () => void;
}

// Component disabled - event notifications now handled by HUD banner only
export const EventStartVisual: React.FC<EventStartVisualProps> = ({ eventType, onComplete }) => {
  // Immediately call onComplete to prevent blocking
  React.useEffect(() => {
    if (eventType && onComplete) {
      onComplete();
    }
  }, [eventType, onComplete]);

  return null;
};
