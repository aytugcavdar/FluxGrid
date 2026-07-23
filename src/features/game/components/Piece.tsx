import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Piece as PieceType, CellType } from '../types';
import { useGameStore } from '../store/gameStore';
import clsx from 'clsx';
import {
  resetVelocityTracking,
  getSharedHoverCoord,
  setSharedHoverCoord,
  getDragVelocity,
  FAST_SWIPE_THRESHOLD,
  findBestPlacement,
  setActiveDragPointerId,
  setSharedPointerPosition,
} from '../utils/placementHelper';
import { gameFeelEvents } from '../../../utils/audio';

interface Props {
  piece: PieceType;
  index?: number;
}

const getShapeBounds = (shape: boolean[][]) => ({
  rows: Math.max(1, shape.length),
  cols: Math.max(1, shape[0]?.length ?? 1),
});

const getTrayBlockSize = (shape: boolean[][], windowWidth: number) => {
  const { rows, cols } = getShapeBounds(shape);
  const gap = windowWidth < 400 ? 1 : windowWidth < 768 ? 1.5 : 2;
  const baseBlockSize = Math.max(12, Math.min(22, windowWidth / 28));
  const slotWidth = Math.max(64, (windowWidth - 34) / 3);
  // The tray is transparent, so tall pieces can use nearly all of its visual
  // height without colliding with a card boundary. This keeps 1x5 pieces from
  // looking disproportionately small next to the rest of the tray.
  const slotHeight = windowWidth >= 768 ? 112 : windowWidth >= 411 ? 74 : 72;
  const maxByWidth = (slotWidth - (gap * (cols - 1)) - 10) / cols;
  const maxByHeight = (slotHeight - (gap * (rows - 1)) - 6) / rows;

  return {
    blockSize: Math.max(8, Math.floor(Math.min(baseBlockSize, maxByWidth, maxByHeight))),
    gap,
  };
};

export const Piece: React.FC<Props> = React.memo(({ piece, index = 0 }) => {
  const { setDraggedPiece, draggedPiece, placePiece, pieces, activeEvent, grid, canPlacePiece } = useGameStore();
  const ref = useRef<HTMLDivElement>(null);
  const activePointerIdRef = useRef<number | null>(null);
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

  const [isFinishingDrag, setIsFinishingDrag] = useState(false);

  const endDrag = (pointerId: number, options: { place: boolean; currentTarget: EventTarget & Element }) => {
    if (activePointerIdRef.current !== pointerId) return;

    if (options.currentTarget.hasPointerCapture?.(pointerId)) {
      options.currentTarget.releasePointerCapture(pointerId);
    }

    document.body.classList.remove('dragging');
    delete document.body.dataset.dragging;

    if (options.place) {
      const hoverCoord = getSharedHoverCoord();
      if (hoverCoord) {
        const velocity = getDragVelocity();
        const isFastSwipe = velocity > FAST_SWIPE_THRESHOLD;
        let target = hoverCoord;

        if (isFastSwipe && !canPlacePiece(grid, piece, hoverCoord.x, hoverCoord.y)) {
          const best = findBestPlacement(grid, piece, hoverCoord.x, hoverCoord.y, 2);
          if (best) {
            target = best;
          }
        }

        if (canPlacePiece(grid, piece, target.x, target.y)) {
          setIsFinishingDrag(true);
          if (!placePiece(piece, target.x, target.y)) {
            setIsFinishingDrag(false);
          }
        }
      }
    }

    activePointerIdRef.current = null;
    setActiveDragPointerId(null);
    setSharedPointerPosition(null);
    setSharedHoverCoord(null);
    setDraggedPiece(null);
    resetVelocityTracking();
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    activePointerIdRef.current = e.pointerId;
    setActiveDragPointerId(e.pointerId);
    setSharedPointerPosition({ x: e.clientX, y: e.clientY });
    
    // Add scroll prevention
    document.body.classList.add('dragging');
    document.body.dataset.dragging = 'true';
    setIsFinishingDrag(false);

    // Velocity sıfırla — yeni drag başlıyor
    resetVelocityTracking();
    
    // Immediate visual feedback
    setDraggedPiece(piece);
    
    gameFeelEvents.dragStart();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    endDrag(e.pointerId, { place: true, currentTarget: e.currentTarget });
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    endDrag(e.pointerId, { place: false, currentTarget: e.currentTarget });
  };


  const renderShape = (p: PieceType) => {
    const { blockSize, gap } = getTrayBlockSize(p.shape, windowWidth);

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
              "rounded-sm transition-all duration-200 relative overflow-hidden"
            )}
            style={{
              width: blockSize,
              height: blockSize,
              background: filled
                ? (p.type === CellType.ICE
                    ? 'linear-gradient(145deg, #e6f8ff 0%, #83d7ef 52%, #1686b1 100%)'
                    : p.type === CellType.BOMB
                      ? 'radial-gradient(circle at 38% 30%, #ff6b61 0%, #dc2626 48%, #7f1d1d 100%)'
                      : p.type === CellType.STONE
                        ? 'linear-gradient(145deg, #94a3b8 0%, #475569 58%, #1e293b 100%)'
                        : p.color)
                : 'transparent',
              border: filled
                ? (p.type === CellType.ICE
                    ? '1px solid rgba(224,242,254,0.95)'
                    : p.type === CellType.BOMB
                      ? '1px solid #ff8a80'
                      : p.type === CellType.STONE
                        ? '1px solid #cbd5e1'
                        : 'none')
                : 'none',
              boxShadow: filled && !isNativeApp
                ? `0 0 ${isMobile ? 2 : 4}px ${
                    p.type === CellType.ICE 
                      ? '#93c5fd' 
                      : p.type === CellType.BOMB 
                        ? '#ef4444'
                        : p.type === CellType.STONE
                          ? '#cbd5e1'
                          : p.color
                  }40`
                : 'none',
              opacity: filled ? 1 : 0,
            }}
          >
            {filled && p.type === CellType.ICE && (
              <>
                <span style={{
                  position: 'absolute', inset: '10%',
                  border: '1px solid rgba(14,116,144,0.3)', borderRadius: 2,
                }} />
                <span style={{
                  position: 'absolute', left: '18%', top: '20%', width: '42%', height: 2,
                  borderRadius: 999, background: 'rgba(255,255,255,0.7)',
                  transform: 'rotate(-24deg)', transformOrigin: 'center',
                }} />
              </>
            )}
            {filled && p.type === CellType.BOMB && (
              <span style={{
                position: 'absolute', left: '28%', top: '32%', width: '44%', height: '44%',
                borderRadius: '50%', background: '#111827', border: '1px solid #fbbf24',
              }} />
            )}
            {filled && p.type === CellType.STONE && (
              <span style={{
                position: 'absolute', left: '31%', top: '43%', width: '38%', height: '34%',
                borderRadius: 2, background: '#e2e8f0', boxShadow: '0 -4px 0 -1px #e2e8f0',
              }} />
            )}
          </div>
        )))}
      </div>
    );
  };

  const isDragging = draggedPiece?.instanceId === piece.instanceId;
  const shouldHideInTray = isDragging || isFinishingDrag;

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
          { "opacity-0": shouldHideInTray }
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
          willChange: shouldHideInTray ? 'transform' : 'auto',
          borderRadius: 8,
          boxShadow: 'none',
          transition: 'none',
        }}
      >
        {/* Special Icon Badge */}
        {piece.type === CellType.BOMB && (
          <div
            className="absolute -top-0.5 -right-0.5 w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center text-[8px] md:text-[10px] font-bold text-white shadow-lg z-10"
            style={{
              background: 'linear-gradient(145deg, #ef4444, #991b1b)',
              border: '1px solid #ff8a80',
            }}
          >
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

