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
  return (
    <motion.div
      layout // Enables automatic layout animation for gravity
      layoutId={cell.id} // Tracks the specific block ID as it moves
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 25,
        layout: { duration: 0.3 } 
      }}
      onClick={onClick}
      className={clsx(
        "relative w-full h-full rounded-md border border-white/5 transition-colors duration-200",
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
          ? `0 0 10px ${cell.color}66, inset 0 0 10px rgba(255,255,255,0.2)` 
          : 'none',
        zIndex: cell.filled ? 10 : 0,
      }}
    >
      {/* Inner glass shine effect */}
      {cell.filled && (
        <div className="absolute inset-0 rounded-md bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
      )}
    </motion.div>
  );
};