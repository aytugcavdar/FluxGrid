import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJuiceStore } from '../store/juiceStore';

export const PlacementFeedbackEffect: React.FC = React.memo(() => {
  const placementFeedback = useJuiceStore((state) => state.placementFeedback);

  return (
    <div className="fixed inset-0 pointer-events-none z-45">
      <AnimatePresence>
        {placementFeedback && (
          <motion.div
            key={placementFeedback.timestamp}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              inset: 0,
              background: placementFeedback.type === 'valid' 
                ? 'radial-gradient(circle at center, rgba(16, 185, 129, 0.2) 0%, transparent 70%)'
                : 'radial-gradient(circle at center, rgba(239, 68, 68, 0.2) 0%, transparent 70%)',
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
});
