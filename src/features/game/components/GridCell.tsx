import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  comboColor?: string; // aktif combo rengi → hücre aura'sına yansır
}

export const GridCell: React.FC<Props> = ({ cell, isGhost, isValidGhost, onClick, isShatterTarget, comboColor }) => {
  const [isClearing, setIsClearing] = React.useState(false);
  const [justPlaced, setJustPlaced] = React.useState(false);
  const [showFlash, setShowFlash] = React.useState(false);

  React.useEffect(() => {
    if (!cell.filled && isClearing) {
      setIsClearing(false);
    }
  }, [cell.filled, isClearing]);

  // Detect when a cell is just filled (for placement animation)
  React.useEffect(() => {
    if (cell.filled && !isGhost) {
      setJustPlaced(true);
      setShowFlash(true);
      const flashTimer = setTimeout(() => setShowFlash(false), 250);
      const bounceTimer = setTimeout(() => setJustPlaced(false), 400);
      return () => {
        clearTimeout(flashTimer);
        clearTimeout(bounceTimer);
      };
    }
  }, [cell.filled, isGhost]);

  // Ghost preview border color
  const ghostBorderColor = isValidGhost
    ? 'rgba(52, 211, 153, 0.7)'  // yeşil — valid
    : 'rgba(148, 163, 184, 0.55)';

  // Ghost background
  const ghostBg = isValidGhost
    ? 'rgba(52, 211, 153, 0.15)'
    : 'rgba(148, 163, 184, 0.12)';

  return (
    <motion.div
      layout
      layoutId={cell.id}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 30,
        layout: { duration: 0.2 },
      }}
      onClick={onClick}
      className={clsx(
        'relative w-full h-full rounded-md transition-colors duration-150',
        {
          'cursor-pointer': isShatterTarget && cell.filled,
        }
      )}
      style={{
        border: isGhost
          ? `1px solid ${ghostBorderColor}`
          : cell.filled
          ? `1px solid rgba(255,255,255,0.12)`
          : '1px solid rgba(255,255,255,0.04)',
        backgroundColor: cell.filled
          ? cell.color
          : isGhost
          ? ghostBg
          : 'rgba(255,255,255,0.03)',
        boxShadow: cell.filled
          ? `0 0 14px ${cell.color}70, 0 0 4px ${cell.color}40, inset 0 0 10px rgba(255,255,255,0.2)${comboColor ? `, 0 0 20px ${comboColor}30` : ''}`
          : isGhost
          ? `0 0 10px ${isValidGhost ? 'rgba(52,211,153,0.35)' : 'rgba(148,163,184,0.22)'}, inset 0 0 8px ${isValidGhost ? 'rgba(52,211,153,0.1)' : 'rgba(148,163,184,0.08)'}`
          : 'none',
        zIndex: cell.filled ? 10 : 0,
        opacity: isGhost ? 0.75 : 1,
      }}
      animate={
        isClearing
          ? { scale: [1, 1.2, 0], opacity: [1, 0.8, 0], rotate: [0, 5, -5, 0] }
          : justPlaced
          ? { scale: [0.75, 1.2, 0.9, 1.05, 1], rotate: [0, -3, 3, -1, 0] }
          : {}
      }
      transition={
        isClearing
          ? { duration: 0.3 }
          : justPlaced
          ? { duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }
          : {}
      }
    >
      {/* Inner glass shine — dolu hücreler için */}
      {cell.filled && (
        <>
          {/* Top-left gradient shine */}
          <div
            className="absolute inset-0 rounded-md pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.35) 0%, transparent 55%)',
            }}
          />
          {/* Breathe pulse — hafif hayat hissi */}
          <motion.div
            className="absolute inset-0 rounded-md pointer-events-none"
            animate={{ opacity: [0.15, 0.35, 0.15] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              background: `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.5) 0%, transparent 65%)`,
            }}
          />
        </>
      )}

      {/* Shatter target hover */}
      {isShatterTarget && cell.filled && (
        <motion.div
          className="absolute inset-0 rounded-md pointer-events-none"
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          style={{ background: 'rgba(251,191,36,0.26)' }}
        />
      )}

      {/* Placement white flash */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            key="flash"
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="absolute inset-0 rounded-md pointer-events-none"
            style={{ background: 'rgba(255,255,255,0.7)', zIndex: 20 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
