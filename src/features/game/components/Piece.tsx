import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Piece as PieceType, CellType } from '../types';
import { useGameStore } from '../store/gameStore';
import clsx from 'clsx';

interface Props {
  piece: PieceType;
}

export const Piece: React.FC<Props> = ({ piece }) => {
  const { setDraggedPiece, draggedPiece, pieces, activeEvent } = useGameStore();
  const ref = useRef<HTMLDivElement>(null);
  const [windowWidth, setWindowWidth] = React.useState(window.innerWidth);
  
  // FOG event: hide shape, show only block count
  const isFogActive = activeEvent === 'FOG';

  // Update window width on resize for responsive block size
  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Detect mobile device
  const isMobile = windowWidth < 768;
  
  // Native mobile app detection
  const isNativeApp = !!(window as any).ReactNativeWebView || 
                     !!(window as any).Capacitor || 
                     /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

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
    // FOG event: Show only block count as dots
    if (isFogActive) {
      const blockCount = p.shape.flat().filter(v => v === 1).length;
      return (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: 6,
          flexWrap: 'wrap',
          maxWidth: '80px'
        }}>
          {Array.from({ length: blockCount }).map((_, i) => (
            <div 
              key={i} 
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                boxShadow: '0 0 4px rgba(255, 255, 255, 0.2)'
              }} 
            />
          ))}
        </div>
      );
    }
    
    // Normal render
    // Responsive block size calculation - updates on window resize
    const blockSize = Math.max(12, Math.min(22, windowWidth / 28));
    const gap = windowWidth < 400 ? 1 : windowWidth < 768 ? 1.5 : 2;

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
              filled && p.type === CellType.ICE && !isNativeApp && "animate-pulse",
              filled && p.type === CellType.BOMB && !isNativeApp && "animate-pulse"
            )}
            style={{
              width: blockSize,
              height: blockSize,
              backgroundColor: filled
                ? (p.type === CellType.ICE ? '#a5f3fc' : p.type === CellType.BOMB ? '#ef4444' : p.color)
                : 'transparent',
              boxShadow: filled && !isNativeApp
                ? `0 0 ${isMobile ? 2 : 4}px ${p.type === CellType.ICE ? '#93c5fd' : p.type === CellType.BOMB ? '#f87171' : p.color}40`
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
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
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
    </div>
  );
};