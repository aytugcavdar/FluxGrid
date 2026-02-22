import React, { useRef } from 'react';
import { Piece as PieceType, CellType } from '../types';
import { useGameStore } from '../store/gameStore';
import clsx from 'clsx';

interface Props {
  piece: PieceType;
}

export const Piece: React.FC<Props> = ({ piece }) => {
  const { setDraggedPiece, draggedPiece } = useGameStore();
  const ref = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    setDraggedPiece(piece);
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

  return (
    <div
      ref={ref}
      onPointerDown={handlePointerDown}
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
  );
};