import React from 'react';

interface EventStartVisualProps {
  eventType: 'ICE_STORM' | 'QUAKE' | 'MIRROR' | 'CHAOS' | 'VOID' | null;
  onComplete?: () => void;
}

// Component disabled - event notifications now handled by HUD banner only
export const EventStartVisual: React.FC<EventStartVisualProps> = React.memo(({ eventType, onComplete }) => {
  // Immediately call onComplete to prevent blocking
  React.useEffect(() => {
    if (eventType && onComplete) {
      onComplete();
    }
  }, [eventType, onComplete]);

  return null;
}, (prevProps, nextProps) => {
  // Only re-render if eventType changes
  return prevProps.eventType === nextProps.eventType;
});
