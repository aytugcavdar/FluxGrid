import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  isValid: boolean;
  x: number;
  y: number;
  blockSize: number;
}

export const GhostPreviewPulse: React.FC<Props> = React.memo(({ isValid, x, y, blockSize }) => {
  return (
    <motion.div
      className="absolute pointer-events-none rounded-md"
      style={{
        left: x * blockSize,
        top: y * blockSize,
        width: blockSize,
        height: blockSize,
      }}
      animate={{
        boxShadow: isValid
          ? [
              '0 0 0px rgba(16, 185, 129, 0.4)',
              '0 0 20px rgba(16, 185, 129, 0.8)',
              '0 0 0px rgba(16, 185, 129, 0.4)',
            ]
          : [
              '0 0 0px rgba(239, 68, 68, 0.4)',
              '0 0 15px rgba(239, 68, 68, 0.8)',
              '0 0 0px rgba(239, 68, 68, 0.4)',
            ],
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}, (prevProps, nextProps) => {
  // Only re-render if props change
  return prevProps.isValid === nextProps.isValid && 
         prevProps.x === nextProps.x && 
         prevProps.y === nextProps.y && 
         prevProps.blockSize === nextProps.blockSize;
});
