import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Piece as PieceType, CellType } from '../types';
import { useGameStore } from '../store/gameStore';
import clsx from 'clsx';

interface Props {
  piece: PieceType;
}

export const Piece: React.FC<Props> = ({ piece }) => {
  const { setDraggedPiece, draggedPiece, guidedTarget, guidedStep, pieces } = useGameStore();
  const ref = useRef<HTMLDivElement>(null);

  // Check if this is the guided piece
  const pieceIndex = pieces.findIndex(p => p.instanceId === piece.instanceId);
  const isGuidedPiece = guidedTarget?.pieceIndex === pieceIndex;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDraggedPiece(piece);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const renderShape = (p: PieceType) => {
    // Auto-calculate block size based on screen width — 3 tiers
    const isSmallPhone = window.innerWidth < 400;
    const isMobile = window.innerWidth < 768;
    const blockSize = isSmallPhone ? 14 : isMobile ? 18 : 22;
    const gap = isSmallPhone ? 1 : isMobile ? 1.5 : 2;

    return (
      <div
        className="grid pointer-events-none"
        style={{
          gridTemplateColumns: `repeat(${p.shape[0].length}, ${blockSize}px)`,
          gap: `${gap}px`
        }}
      >
        {p.shape.map((row, y) => row.map((filled, x) => (
          <div
            key={`${y}-${x}`}
            className={clsx(
              "rounded-sm transition-all duration-300",
              filled && p.type === CellType.ICE && "animate-pulse",
              filled && p.type === CellType.BOMB && "animate-pulse"
            )}
            style={{
              width: blockSize,
              height: blockSize,
              backgroundColor: filled
                ? (p.type === CellType.ICE ? '#a5f3fc' : p.type === CellType.BOMB ? '#ef4444' : p.color)
                : 'transparent',
              boxShadow: filled
                ? `0 0 ${isMobile ? 3 : 4}px ${p.type === CellType.ICE ? '#93c5fd' : p.type === CellType.BOMB ? '#f87171' : p.color}40`
                : 'none',
              opacity: filled ? 1 : 0,
            }}
          />
        )))}
      </div>
    );
  };

  const isDragging = draggedPiece?.instanceId === piece.instanceId;

  // Wrapper component for guided animation
  const PieceWrapper = isGuidedPiece ? motion.div : 'div';
  const wrapperProps = isGuidedPiece ? {
    animate: { scale: [1, 1.05, 1] },
    transition: { duration: 1.2, repeat: Infinity }
  } : {};

  return (
    <PieceWrapper {...wrapperProps} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div
        ref={ref}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        className={clsx(
          "relative w-full h-full flex items-center justify-center transition-all duration-200 cursor-grab active:cursor-grabbing touch-none select-none",
          { "opacity-25 scale-90": isDragging }
        )}
        // Ensure minimum tap target
        style={{ minWidth: 44, minHeight: 44 }}
      >
        {/* Special Icon Badge */}
        {piece.type === CellType.ICE && (
          <div className="absolute -top-0.5 -right-0.5 w-4 h-4 md:w-5 md:h-5 bg-blue-400 rounded-full flex items-center justify-center text-[8px] md:text-[10px] font-bold text-white shadow z-10">
            ❄️
          </div>
        )}
        {piece.type === CellType.BOMB && (
          <div className="absolute -top-0.5 -right-0.5 w-4 h-4 md:w-5 md:h-5 bg-red-500 rounded-full flex items-center justify-center text-[8px] md:text-[10px] font-bold text-white shadow-lg z-10">
            💣
          </div>
        )}

        {renderShape(piece)}
      </div>
      
      {/* Guided finger indicator */}
      {isGuidedPiece && guidedStep === 1 && (
        <motion.div
          style={{
            position: 'absolute',
            bottom: -20,
            left: '50%',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
            zIndex: 100
          }}
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
            <path d="M10 2C10 2 10 18 10 18" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
            <path d="M6 14L10 18L14 14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
          </svg>
        </motion.div>
      )}
    </PieceWrapper>
  );
};