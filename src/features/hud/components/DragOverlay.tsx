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
        perspective: '1000px',
      }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, rotateX: -20 }}
        animate={{ 
          scale: 1, 
          opacity: 1,
          rotateX: 0,
        }}
        className="flex flex-col items-center justify-center"
        style={{ 
          gap: `${gap}px`,
          transformStyle: 'preserve-3d',
        }}
      >
        {draggedPiece.shape.map((row, rIdx) => (
          <div 
            key={rIdx} 
            className="flex" 
            style={{ 
              gap: `${gap}px`,
              transformStyle: 'preserve-3d',
            }}
          >
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
                  boxShadow: cell && !isNativeApp 
                    ? `
                      0 4px ${isMobile ? 8 : 12}px ${draggedPiece.color}40,
                      0 8px ${isMobile ? 16 : 24}px ${draggedPiece.color}20,
                      inset 0 -2px 4px rgba(0,0,0,0.3),
                      inset 0 2px 4px rgba(255,255,255,0.2)
                    `
                    : cell ? 'inset 0 -2px 4px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.2)' : 'none',
                  border: cell ? `1px solid ${draggedPiece.color}60` : 'none',
                  opacity: cell ? 0.5 : 0,
                  transform: cell ? 'translateZ(8px)' : 'none',
                  transformStyle: 'preserve-3d',
                  position: 'relative',
                  background: cell 
                    ? `linear-gradient(135deg, 
                        ${draggedPiece.type === 'ICE' ? '#93c5fd' : draggedPiece.type === 'BOMB' ? '#f87171' : draggedPiece.color}99 0%, 
                        ${draggedPiece.type === 'ICE' ? '#60a5fa' : draggedPiece.type === 'BOMB' ? '#ef4444' : draggedPiece.color}77 100%
                      )`
                    : 'transparent',
                }}
              >
                {cell && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '40%',
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%)',
                      borderRadius: '6px 6px 0 0',
                      pointerEvents: 'none',
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
};
