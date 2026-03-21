import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../game/store/gameStore';
import { getDragYOffset } from '@utils/responsive';

export const DragOverlay: React.FC = () => {
  const draggedPiece = useGameStore(state => state.draggedPiece);
  const [pos, setPos] = useState({ x: -1000, y: -1000 });

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('pointermove', handleMove);
    return () => window.removeEventListener('pointermove', handleMove);
  }, []);

  if (!draggedPiece) return null;

  const isMobile = window.innerWidth < 768;
  const isSmallPhone = window.innerWidth < 400;
  
  // Native mobile app detection
  const isNativeApp = !!(window as any).ReactNativeWebView || 
                     !!(window as any).Capacitor || 
                     /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  const yOffset = getDragYOffset();
  const cellSize = isSmallPhone ? 28 : isMobile ? 32 : 42;
  const gap = isSmallPhone ? 1.5 : 2;

  return (
    <div
      className="fixed pointer-events-none z-[100]"
      style={{
        left: pos.x,
        top: pos.y + yOffset,
        transform: `translate(-50%, -50%) scale(${isMobile ? 1.05 : 1.02})`,
        transition: 'transform 0.1s ease-out',
      }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center justify-center"
        style={{ gap: `${gap}px` }}
      >
        {draggedPiece.shape.map((row, rIdx) => (
          <div key={rIdx} className="flex" style={{ gap: `${gap}px` }}>
            {row.map((cell, cIdx) => (
              <div
                key={cIdx}
                style={{
                  width: cellSize,
                  height: cellSize,
                  borderRadius: 6,
                  backgroundColor: cell
                    ? (draggedPiece.type === 'ICE' ? '#93c5fd' : draggedPiece.type === 'BOMB' ? '#f87171' : draggedPiece.color)
                    : 'transparent',
                  boxShadow: cell && !isNativeApp ? `0 2px ${isMobile ? 4 : 8}px ${draggedPiece.color}30` : 'none',
                  border: cell ? `1px solid ${draggedPiece.color}40` : 'none',
                  opacity: cell ? 0.9 : 0,
                }}
              />
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
};
