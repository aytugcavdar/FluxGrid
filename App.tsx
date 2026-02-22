import React, { useEffect, useState } from 'react';
import { Grid } from './components/Grid';
import { useGameStore } from './store/gameStore';
import { Piece } from './components/Piece';
import { HUD } from './components/HUD';
import { Tutorial, shouldShowTutorial } from './components/Tutorial';
import { motion, AnimatePresence } from 'framer-motion';
import { unlockAudio, playGameOver } from './utils/audio';
import clsx from 'clsx';

const DragOverlay = () => {
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
  // Dynamic offset: scale with screen height for better finger clearance on different devices
  const yOffset = isMobile ? Math.min(-90, -window.innerHeight * 0.11) : 0;
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
                    ? (draggedPiece.type === 'ICE' ? '#a5f3fc' : draggedPiece.type === 'BOMB' ? '#ef4444' : draggedPiece.color)
                    : 'transparent',
                  boxShadow: cell ? `0 0 20px ${draggedPiece.color}, inset 0 0 8px rgba(255,255,255,0.3)` : 'none',
                  opacity: cell ? 0.85 : 0,
                  transition: 'box-shadow 0.2s',
                }}
              />
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

const App: React.FC = () => {
  const { initGame, pieces, isGameOver, resetGame, score } = useGameStore();
  const [showTutorial, setShowTutorial] = useState(shouldShowTutorial);
  const [prevGameOver, setPrevGameOver] = useState(false);

  useEffect(() => {
    initGame();
    // Unlock audio on first interaction
    const handleFirstTouch = () => {
      unlockAudio();
      window.removeEventListener('pointerdown', handleFirstTouch);
    };
    window.addEventListener('pointerdown', handleFirstTouch);
    return () => window.removeEventListener('pointerdown', handleFirstTouch);
  }, [initGame]);

  // Play game over sound
  useEffect(() => {
    if (isGameOver && !prevGameOver) {
      playGameOver();
    }
    setPrevGameOver(isGameOver);
  }, [isGameOver]);

  return (
    <div className="game-container">

      {/* Cinematic Background — lighter on mobile */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[20%] w-[60%] h-[60%] rounded-full bg-cyan-900/15 blur-[100px] md:bg-cyan-900/20 md:blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[20%] w-[60%] h-[60%] rounded-full bg-fuchsia-900/15 blur-[100px] md:bg-fuchsia-900/20 md:blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] opacity-20 md:opacity-30" />
      </div>

      {/* Top Bar: Title & Stats */}
      <div className="game-hud">
        <div className="max-w-2xl mx-auto flex justify-between items-start md:items-center h-full">
          <div className="text-left opacity-80 hidden md:block">
            <h1 className="text-xl font-black font-display tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-fuchsia-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">
              FLUX<span className="font-light text-white/90">GRID</span>
            </h1>
          </div>
          <div className="flex-1 md:ml-4 w-full">
            <HUD />
          </div>
        </div>
      </div>

      {/* Main Game Area: The Grid */}
      <div className="game-grid">
        <Grid />
      </div>

      {/* Bottom Bar: Piece Tray */}
      <div className="game-tray bg-gradient-to-t from-black/90 via-black/60 to-transparent">
        <div className="max-w-2xl mx-auto px-3 md:px-4 h-full flex flex-col">
          <div className="flex justify-between items-end mb-1 px-1">
            <span className="text-[9px] md:text-[10px] uppercase tracking-widest text-white/40 font-mono">Kuantum Tepsisi</span>
          </div>

          <div className="grid grid-cols-3 gap-2 flex-1 min-h-0">
            <AnimatePresence mode="popLayout">
              {pieces.map((piece) => (
                <motion.div
                  key={piece.instanceId}
                  layoutId={piece.instanceId}
                  initial={{ opacity: 0, scale: 0.5, y: 50 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0, filter: 'blur(10px)' }}
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', bounce: 0.4, duration: 0.5 }}
                  className={clsx(
                    "piece-slot border transition-colors",
                    piece.type === 'ICE' ? "bg-cyan-900/20 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]" :
                      piece.type === 'BOMB' ? "bg-red-900/20 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]" :
                        "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20"
                  )}
                >
                  <Piece piece={piece} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <DragOverlay />

      {/* Tutorial */}
      <AnimatePresence>
        {showTutorial && (
          <Tutorial onComplete={() => setShowTutorial(false)} />
        )}
      </AnimatePresence>

      {/* Game Over Overlay */}
      <AnimatePresence>
        {isGameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', bounce: 0.3 }}
              className="bg-[#0f172a] border border-white/10 p-6 md:p-8 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] max-w-xs md:max-w-sm w-full text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 to-transparent pointer-events-none" />

              <h2 className="text-3xl md:text-4xl font-display font-black text-white mb-2 tracking-tighter">KRİTİK<br />HATA</h2>
              <div className="w-16 h-1 bg-red-500 mx-auto mb-5 rounded-full shadow-[0_0_10px_red]" />

              <p className="text-slate-400 text-xs md:text-sm uppercase tracking-widest mb-2">Son Skor</p>
              <div className="text-4xl md:text-5xl font-mono font-bold text-cyan-400 mb-6 md:mb-8 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                {score.toLocaleString()}
              </div>

              <button
                onClick={resetGame}
                className="group relative w-full py-3.5 md:py-4 rounded-xl bg-white text-black font-bold tracking-wider overflow-hidden transition-transform active:scale-95"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-fuchsia-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10 group-hover:text-white transition-colors text-sm md:text-base">SİSTEMİ YENİLE</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;