import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Piece as PieceType, CellType } from '../types';
import { useGameStore } from '../store/gameStore';
import clsx from 'clsx';
import { resetVelocityTracking, getSharedHoverCoord, setSharedHoverCoord, getDragVelocity, FAST_SWIPE_THRESHOLD, findBestPlacement } from '../utils/placementHelper';

interface Props {
  piece: PieceType;
  index?: number;
}

export const Piece: React.FC<Props> = React.memo(({ piece, index = 0 }) => {
  const { setDraggedPiece, draggedPiece, placePiece, pieces, activeEvent, grid, canPlacePiece } = useGameStore();
  const ref = useRef<HTMLDivElement>(null);
  const [windowWidth, setWindowWidth] = React.useState(window.innerWidth);

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

  const [flashDown, setFlashDown] = useState(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    
    // Add scroll prevention
    document.body.classList.add('dragging');
    
    setFlashDown(true);
    setTimeout(() => setFlashDown(false), 120);

    // Velocity sıfırla — yeni drag başlıyor
    resetVelocityTracking();
    
    // Immediate visual feedback
    setDraggedPiece(piece);
    
    // Quick haptic feedback for better responsiveness
    if ('vibrate' in navigator) {
      navigator.vibrate(10); // Very short vibration for instant feedback
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    document.body.classList.remove('dragging');

    // PRIMARY placement path - runs reliably on Capacitor because
    // setPointerCapture guarantees this element receives pointerup.
    // Grid render loop writes hover coord to shared state.
    const hoverCoord = getSharedHoverCoord();
    if (hoverCoord) {
      const velocity = getDragVelocity();
      const isFastSwipe = velocity > FAST_SWIPE_THRESHOLD;

      if (isFastSwipe) {
        // Hizli kaydirma: 2 hucre yaricapinda en yakin gecerli konumu bul
        const best = findBestPlacement(grid, piece, hoverCoord.x, hoverCoord.y, 2);
        if (best) {
          placePiece(piece, best.x, best.y);
        } else {
          placePiece(piece, hoverCoord.x, hoverCoord.y);
        }
      } else {
        // Normal birakma: 1 hucre snap zaten Grid render loopda yapildi
        placePiece(piece, hoverCoord.x, hoverCoord.y);
      }
    }

    // Clear shared hover coord and drag state
    setSharedHoverCoord(null);
    setDraggedPiece(null);
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    document.body.classList.remove('dragging');
    setSharedHoverCoord(null);
    setDraggedPiece(null);
  };


  const renderShape = (p: PieceType) => {
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
              "rounded-sm transition-all duration-200",
              filled && p.type === CellType.ICE && !isNativeApp && "animate-pulse",
              filled && p.type === CellType.BOMB && !isNativeApp && "animate-pulse"
            )}
            style={{
              width: blockSize,
              height: blockSize,
              backgroundColor: filled
                ? (p.type === CellType.ICE 
                    ? '#a5f3fc' 
                    : p.type === CellType.BOMB 
                      ? '#ef4444' 
                      : p.color)
                : 'transparent',
              boxShadow: filled && !isNativeApp
                ? `0 0 ${isMobile ? 2 : 4}px ${
                    p.type === CellType.ICE 
                      ? '#93c5fd' 
                      : p.type === CellType.BOMB 
                        ? '#f87171' 
                        : p.color
                  }40`
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
    <motion.div
      data-piece-slot={index}
      style={{ position: 'relative', width: '100%', height: '100%' }}
    >
      <motion.div
        ref={ref}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        className={clsx(
          "relative w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none",
          { "opacity-25": isDragging }
        )}
        animate={{ 
          scale: isDragging ? 0.92 : 1, // Daha az scale değişimi
          rotate: isDragging ? 0.5 : 0 // Daha az rotasyon
        }}
        transition={{ 
          type: "spring", 
          stiffness: 500, // Çok daha hızlı response
          damping: 35, // Daha az bounce
          mass: 0.4 // Daha hafif
        }}
        style={{ 
          minWidth: 44, 
          minHeight: 44,
          willChange: isDragging ? 'transform' : 'auto',
          borderRadius: 8,
          // Flash on pointer down for instant tactile feedback
          boxShadow: flashDown ? `0 0 16px ${piece.color}80` : 'none',
          transition: 'box-shadow 0.1s ease',
        }}
      >
        {/* Special Icon Badge */}
        {piece.type === CellType.ICE && (
          <div className="absolute -top-0.5 -right-0.5 w-4 h-4 md:w-5 md:h-5 bg-blue-400 rounded-full flex items-center justify-center text-[8px] md:text-[10px] font-bold text-white shadow z-10">
            {String.fromCodePoint(0x2744)}
          </div>
        )}
        {piece.type === CellType.BOMB && (
          <div className="absolute -top-0.5 -right-0.5 w-4 h-4 md:w-5 md:h-5 bg-red-500 rounded-full flex items-center justify-center text-[8px] md:text-[10px] font-bold text-white shadow-lg z-10">
            {String.fromCodePoint(0x1F4A3)}
          </div>
        )}
        {renderShape(piece)}
      </motion.div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if piece reference or index changes
  return prevProps.piece === nextProps.piece && prevProps.index === nextProps.index;
});

