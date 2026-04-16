import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { GridCell as CellType } from '../types';

interface Props {
  cell: CellType;
  x: number;
  y: number;
  isGhost?: boolean;
  isValidGhost?: boolean;
  onClick?: () => void;
  isShatterTarget?: boolean;
}

export const GridCell: React.FC<Props> = ({ cell, isGhost, isValidGhost, onClick, isShatterTarget }) => {
  const [isClearing, setIsClearing] = React.useState(false);
  const [justPlaced, setJustPlaced] = React.useState(false);

  React.useEffect(() => {
    if (!cell.filled && isClearing) {
      setIsClearing(false);
    }
  }, [cell.filled, isClearing]);

  // Detect when a cell is just filled (for placement animation)
  React.useEffect(() => {
    if (cell.filled && !isGhost) {
      setJustPlaced(true);
      const timer = setTimeout(() => setJustPlaced(false), 300);
      return () => clearTimeout(timer);
    }
  }, [cell.filled, isGhost]);

  return (
    <motion.div
      layout // Enables automatic layout animation for gravity
      layoutId={cell.id} // Tracks the specific block ID as it moves
      transition={{ 
        type: "spring", 
        stiffness: 400, // Daha hızlı
        damping: 30, // Daha kontrollü
        layout: { duration: 0.2 } // Daha hızlı layout animasyonu
      }}
      onClick={onClick}
      className={clsx(
        "relative w-full h-full rounded-md border border-white/5 transition-colors duration-150",
        {
          "bg-white/5": !cell.filled && !isGhost,
          "cursor-pointer hover:bg-red-500/20 hover:border-red-500/50": isShatterTarget && cell.filled,
          "opacity-50": isGhost,
        }
      )}
      style={{
        backgroundColor: cell.filled 
          ? cell.color 
          : isGhost && isValidGhost 
            ? 'rgba(255, 255, 255, 0.2)' 
            : isGhost && !isValidGhost
              ? 'rgba(239, 68, 68, 0.2)'
              : undefined,
        boxShadow: cell.filled 
          ? `0 0 12px ${cell.color}80, inset 0 0 12px rgba(255,255,255,0.3)` 
          : 'none',
        zIndex: cell.filled ? 10 : 0,
      }}
      animate={
        isClearing ? {
          scale: [1, 1.2, 0],
          opacity: [1, 0.8, 0],
          rotate: [0, 5, -5, 0]
        } : justPlaced ? {
          scale: [0.8, 1.15, 0.95, 1.05, 1],
          rotate: [0, -2, 2, -1, 0]
        } : {}
      }
      transition={
        isClearing ? { duration: 0.3 } : 
        justPlaced ? { 
          duration: 0.4,
          ease: [0.34, 1.56, 0.64, 1] // Bounce easing
        } : {}
      }
    >
      {/* Inner glass shine effect */}
      {cell.filled && (
        <>
          <div className="absolute inset-0 rounded-md bg-gradient-to-tr from-white/30 to-transparent pointer-events-none" />
          {/* Sparkle effect */}
          <motion.div
            className="absolute inset-0 rounded-md pointer-events-none"
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 60%)`
            }}
          />
        </>
      )}
    </motion.div>
  );
};