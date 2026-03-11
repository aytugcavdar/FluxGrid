import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Grid } from './components/Grid';
import { useGameStore } from './store/gameStore';
import { useThemeStore } from './store/themeStore';
import { useAbilityStore } from './store/abilityStore';
import { usePassiveAbilityStore } from './store/passiveAbilityStore';
import { useProfileStore } from './store/profileStore';
import { HUD } from './components/HUD';
import { LevelMap } from './components/LevelMap';
import { CareerPage } from './components/CareerPage';
import { Piece } from './components/Piece';
import { Tutorial, shouldShowTutorial } from './components/Tutorial';
import { AbilityPanel } from './components/AbilityPanel';
import { ProfileView } from './components/ProfileView';
import { motion, AnimatePresence } from 'framer-motion';
import { unlockAudio, playGameOver, playClick } from './utils/audio';
import clsx from 'clsx';
import { AppState, GameMode } from './types';
import { getDragYOffset } from './utils/responsive';

/* ─── Score Popup ─── */
interface ScorePopup {
  id: number;
  value: number;
  combo: number;
}

const ScorePopups: React.FC<{ popups: ScorePopup[] }> = ({ popups }) => (
  <div className="fixed top-16 left-0 right-0 flex flex-col items-center pointer-events-none z-50">
    <AnimatePresence>
      {popups.map(p => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.6 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex items-center gap-2 mb-1"
        >
          <span className="text-lg md:text-xl font-bold text-white/90">
            +{p.value.toLocaleString()}
          </span>
          {p.combo > 1 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              x{p.combo} Kombo
            </span>
          )}
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

/* ─── Chain Counter ─── */
const ChainCounter: React.FC<{ chain: number }> = ({ chain }) => {
  if (chain < 2) return null;
  return (
    <motion.div
      key={`chain-${chain}-${Date.now()}`}
      initial={{ opacity: 0, scale: 0.5, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 1.3, y: -40 }}
      transition={{ duration: 0.35, ease: 'backOut' }}
      className="flex flex-col items-center"
    >
      <span className="text-2xl md:text-4xl font-black tracking-tight"
        style={{
          color: chain >= 4 ? '#f59e0b' : chain >= 3 ? '#a78bfa' : '#60a5fa'
        }}>
        x{chain} ZİNCİR
      </span>
      <span className="text-[10px] tracking-widest text-white/40 uppercase">Zincir Reaksiyon</span>
    </motion.div>
  );
};

/* ─── Perfect Bonus ─── */
const PerfectBonus: React.FC<{ show: boolean }> = ({ show }) => {
  if (!show) return null;
  return (
    <motion.div
      key={`perfect-${Date.now()}`}
      initial={{ opacity: 0, scale: 0.6, y: 10 }}
      animate={{ opacity: 1, scale: 1.1, y: -10 }}
      exit={{ opacity: 0, scale: 0.8, y: -40 }}
      transition={{ duration: 0.4, ease: 'backOut' }}
      className="flex flex-col items-center"
    >
      <span className="text-3xl md:text-5xl font-black tracking-tight"
        style={{ color: '#fbbf24' }}>
        ✦ PERFECT!
      </span>
      <span className="text-[10px] tracking-widest text-amber-400/60 uppercase">+%50 Renk Bonusu</span>
    </motion.div>
  );
};

/* ─── Surge Flash ─── */
const SurgeFlash: React.FC<{ active: boolean }> = ({ active }) => (
  <AnimatePresence>
    {active && (
      <motion.div
        key="surge-flash"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.18, 0.05] }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.2, times: [0, 0.15, 1] }}
        className="fixed inset-0 pointer-events-none z-40"
        style={{ background: 'radial-gradient(circle at center, rgba(251,191,36,0.1) 0%, transparent 60%)' }}
      />
    )}
  </AnimatePresence>
);

/* ─── Combo Flash ─── */
const ComboFlash: React.FC<{ combo: number }> = ({ combo }) => {
  if (combo <= 1) return null;
  return (
    <motion.div
      key={combo}
      initial={{ opacity: 0.4 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 pointer-events-none z-30"
      style={{
        background: `radial-gradient(circle at center, ${combo >= 5 ? 'rgba(245,158,11,0.06)' : combo >= 3 ? 'rgba(99,102,241,0.05)' : 'rgba(59,130,246,0.04)'} 0%, transparent 60%)`,
      }}
    />
  );
};

/* ─── Drag Overlay ─── */
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
                  boxShadow: cell ? `0 2px 8px ${draggedPiece.color}30` : 'none',
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

/* ─── Main App ─── */
const App: React.FC = () => {
  const {
    initGame, pieces, isGameOver, resetGame, score, combo, lastAction, isSurgeActive,
    isLevelComplete, nextLevel, currentLevelIndex, movesLeft, levelObjectives,
    achievements, unlockedAchievementId, appState, setAppState, gameMode, tickTimer, timeLeft
  } = useGameStore();
  const { currentTheme, setTheme, getThemeColors } = useThemeStore();
  const [showTutorial, setShowTutorial] = useState(shouldShowTutorial);
  const [showAbilities, setShowAbilities] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [prevGameOver, setPrevGameOver] = useState(false);
  const [scorePopups, setScorePopups] = useState<ScorePopup[]>([]);
  const prevScoreRef = useRef(0);
  const popupIdRef = useRef(0);
  const [shownChain, setShownChain] = useState(0);
  const [showPerfect, setShowPerfect] = useState(false);
  const [showSurgeFlash, setShowSurgeFlash] = useState(false);
  const lastActionRef = useRef<typeof lastAction>(null);
  const prevSurgeRef = useRef(false);

  // Game Over Message Helper
  const getGameOverMessage = () => {
    if (gameMode === GameMode.ENDLESS) {
      return {
        title: 'Harika Oyun!',
        subtitle: 'Artık Hamle Kalmadı',
        description: 'Tüm parçalar yerleştirilemez durumda'
      };
    }
    
    if (gameMode === GameMode.TIMED) {
      if (timeLeft <= 0) {
        return {
          title: 'Süre Doldu!',
          subtitle: 'Quantum Rush Sona Erdi',
          description: `${score.toLocaleString()} puan kazandın`
        };
      }
    }
    
    if (gameMode === GameMode.CAREER) {
      if (movesLeft <= 0) {
        return {
          title: 'Hamle Bitti',
          subtitle: `Seviye ${currentLevelIndex} Başarısız`,
          description: 'Hedeflere ulaşamadın'
        };
      }
      return {
        title: 'Oyun Bitti',
        subtitle: `Seviye ${currentLevelIndex}`,
        description: 'Artık hamle kalmadı'
      };
    }
    
    return {
      title: 'Oyun Bitti',
      subtitle: 'Tekrar Dene',
      description: ''
    };
  };

  // Initialize stores on mount
  useEffect(() => {
    useAbilityStore.getState().initializeAbilities();
    usePassiveAbilityStore.getState().initializePassives();
    useProfileStore.getState().initializeProfile();
  }, []);

  useEffect(() => {
    // We don't call initGame() here anymore to allow starting on the HOME screen.
    const handleFirstTouch = () => {
      unlockAudio();
      window.removeEventListener('pointerdown', handleFirstTouch);
    };
    window.addEventListener('pointerdown', handleFirstTouch);
    return () => window.removeEventListener('pointerdown', handleFirstTouch);
  }, []);

  // Global Timer Loop
  useEffect(() => {
    if (gameMode !== GameMode.TIMED || appState !== AppState.GAME || isGameOver) return;
    const interval = setInterval(() => {
      tickTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, [gameMode, appState, isGameOver, tickTimer]);

  // Play game over sound
  useEffect(() => {
    if (isGameOver && !prevGameOver) {
      playGameOver();
    }
    setPrevGameOver(isGameOver);
  }, [isGameOver]);

  // Score popup on score change
  useEffect(() => {
    if (score > prevScoreRef.current && prevScoreRef.current > 0) {
      const diff = score - prevScoreRef.current;
      const id = popupIdRef.current++;
      setScorePopups(prev => [...prev.slice(-3), { id, value: diff, combo }]);
      setTimeout(() => {
        setScorePopups(prev => prev.filter(p => p.id !== id));
      }, 1200);
    }
    prevScoreRef.current = score;
  }, [score, combo]);

  // Zincir + Renk bonusu
  useEffect(() => {
    if (!lastAction || lastAction === lastActionRef.current) return;
    lastActionRef.current = lastAction;
    if (lastAction.type !== 'CLEAR') return;

    const chain = lastAction.chainCount ?? 0;
    if (chain >= 2) {
      setShownChain(chain);
      setTimeout(() => setShownChain(0), 1400);
    }
    if (lastAction.colorBonus) {
      setShowPerfect(true);
      setTimeout(() => setShowPerfect(false), 1600);
    }
  }, [lastAction]);

  // Surge flash
  useEffect(() => {
    if (isSurgeActive && !prevSurgeRef.current) {
      setShowSurgeFlash(true);
      setTimeout(() => setShowSurgeFlash(false), 1200);
    }
    prevSurgeRef.current = isSurgeActive;
  }, [isSurgeActive]);

  // Achievement notification timeout
  const { clearAchievementNotification } = useGameStore();
  useEffect(() => {
    if (unlockedAchievementId) {
      const timer = setTimeout(() => {
        clearAchievementNotification();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [unlockedAchievementId, clearAchievementNotification]);

  return (
    <div className="game-container" onPointerDown={unlockAudio} style={{ background: getThemeColors().background }}>
      <AnimatePresence mode="wait">
        {appState === AppState.HOME && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-gray-900 overflow-hidden"
          >
            {/* Logo Section */}
            <motion.div
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              className="text-center mb-16"
            >
              <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white mb-2 leading-none uppercase">
                FLUX<span className="text-blue-500">GRID</span>
              </h1>
              <div className="flex items-center justify-center gap-2">
                <div className="h-[1px] w-8 bg-blue-500/40" />
                <span className="text-[10px] uppercase tracking-[0.4em] text-white/40 font-bold">Zen Puzzle Adventure</span>
                <div className="h-[1px] w-8 bg-blue-500/40" />
              </div>
            </motion.div>

            {/* Main Menu */}
            <div className="w-full max-w-xs space-y-4">
              <button
                onClick={() => { playClick(); setAppState(AppState.MODES); }}
                className="w-full py-5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black tracking-[0.2em] transition-all active:scale-95 shadow-xl shadow-blue-900/40 uppercase italic"
              >
                OYNA
              </button>

              <button
                onClick={() => { playClick(); setAppState(AppState.MAP); }}
                className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 font-bold tracking-widest transition-all active:scale-95 uppercase text-xs"
              >
                SEVİYE HARİTASI
              </button>
              
              <button
                onClick={() => { playClick(); setShowThemeSelector(true); }}
                className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 font-bold tracking-widest transition-all active:scale-95 uppercase text-xs flex items-center justify-center gap-2"
              >
                <span>🎨</span> TEMA
              </button>
            </div>
          </motion.div>
        )}

        {appState === AppState.MODES && (
          <motion.div
            key="modes"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-gray-900"
          >
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black text-white italic tracking-tight uppercase mb-2">MOD SEÇİMİ</h2>
              <p className="text-white/40 text-[10px] tracking-widest uppercase font-bold">Nasıl Oynamak İstersin?</p>
            </div>

            <div className="w-full max-w-xs space-y-4">
              <button
                onClick={() => { playClick(); setAppState(AppState.MAP); }}
                className="group relative w-full p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-blue-600/10 hover:border-blue-500/30 transition-all text-left overflow-hidden"
              >
                <div className="relative z-10">
                  <span className="block text-xl font-black text-white italic tracking-tight mb-1">KARİYER</span>
                  <span className="block text-[10px] text-white/40 font-bold uppercase tracking-widest">Hikaye Modu & Görevler</span>
                </div>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-3xl opacity-20 group-hover:opacity-100 transition-opacity">🗺️</div>
              </button>

              <button
                onClick={() => { playClick(); initGame(GameMode.ENDLESS); }}
                className="group relative w-full p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-purple-600/10 hover:border-purple-500/30 transition-all text-left overflow-hidden"
              >
                <div className="relative z-10">
                  <span className="block text-xl font-black text-white italic tracking-tight mb-1">SONSUZ</span>
                  <span className="block text-[10px] text-white/40 font-bold uppercase tracking-widest">Limit Yok, Sadece Skor</span>
                </div>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-3xl opacity-20 group-hover:opacity-100 transition-opacity">♾️</div>
              </button>

              <button
                onClick={() => { playClick(); initGame(GameMode.TIMED); }}
                className="group relative w-full p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-amber-600/10 hover:border-amber-500/30 transition-all text-left overflow-hidden"
              >
                <div className="relative z-10">
                  <span className="block text-xl font-black text-white italic tracking-tight mb-1">QUANTUM RUSH</span>
                  <span className="block text-[10px] text-white/40 font-bold uppercase tracking-widest">Hızlı Ol, Süre Kazan</span>
                </div>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-3xl opacity-20 group-hover:opacity-100 transition-opacity">⚡</div>
              </button>

              <button
                onClick={() => { playClick(); setAppState(AppState.HOME); }}
                className="w-full py-4 text-white/40 text-[10px] font-bold uppercase tracking-[0.3em] hover:text-white transition-colors"
              >
                ← Geri Dön
              </button>
            </div>
          </motion.div>
        )}

        {appState === AppState.MAP && (
          <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LevelMap />
          </motion.div>
        )}

        {appState === AppState.CAREER && (
          <motion.div key="career" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CareerPage />
          </motion.div>
        )}

        {appState === AppState.GAME && (
          <motion.div
            key="game"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 flex flex-col z-30 overflow-hidden"
          >
            {/* HUD */}
            <header className="flex-none p-2 md:p-4 md:p-6 w-full max-w-4xl mx-auto">
              <div className="h-[36px] md:h-[52px]">
                <HUD
                  onOpenAbilities={() => setShowAbilities(true)}
                  onOpenProfile={() => setShowProfile(true)}
                />
              </div>
            </header>

            {/* Grid Area */}
            <main className="flex-1 relative flex items-center justify-center p-1 md:p-2 min-h-0">
              <div className="w-full h-full max-h-[85dvh] md:max-h-[70dvh] aspect-square flex items-center justify-center">
                <Grid />
              </div>
            </main>

            {/* Piece Tray */}
            <div className="game-tray bg-gradient-to-t from-gray-900/90 via-gray-900/50 to-transparent">
              <div className="max-w-2xl mx-auto px-2 md:px-4 h-full flex flex-col">
                <div className="flex justify-between items-end mb-0 md:mb-0.5 px-1">
                  <span className="text-[8px] md:text-[9px] uppercase tracking-widest text-white/30 font-medium">Parça Tepsisi</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 md:gap-2 flex-1 min-h-0 pb-1 md:pb-4">
                  <AnimatePresence mode="popLayout">
                    {pieces.map((piece) => (
                      <motion.div
                        key={piece.instanceId}
                        layout
                        initial={{ scale: 0.6, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        className={clsx(
                          "piece-slot border transition-colors h-full",
                          piece.type === 'ICE' ? "bg-blue-900/15 border-blue-400/20" :
                            piece.type === 'BOMB' ? "bg-red-900/15 border-red-400/20" :
                              "bg-white/[0.03] border-white/[0.04] hover:bg-white/[0.06]"
                        )}
                      >
                        <Piece piece={piece} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Game Visual Effects */}
            <ScorePopups popups={scorePopups} />
            <ComboFlash combo={combo} />
            <SurgeFlash active={showSurgeFlash} />
            <div className="fixed top-20 left-0 right-0 flex flex-col items-center gap-2 pointer-events-none z-50">
              <AnimatePresence mode="popLayout">
                {shownChain >= 2 && <ChainCounter key={`c${shownChain}`} chain={shownChain} />}
                {showPerfect && <PerfectBonus key="perfect" show={showPerfect} />}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistence and Global Overlays */}
      <DragOverlay />
      <AnimatePresence>
        {showTutorial && <Tutorial onComplete={() => setShowTutorial(false)} />}
        {showAbilities && <AbilityPanel onClose={() => setShowAbilities(false)} />}
        {showProfile && <ProfileView onClose={() => setShowProfile(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {isLevelComplete && gameMode === GameMode.CAREER && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-blue-900/40 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-gray-800 border-2 border-blue-500/30 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center"
            >
              <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="text-4xl">🏆</motion.span>
              </div>
              <h2 className="text-3xl font-black text-white mb-2 italic tracking-tight">TEBRİKLER!</h2>
              <p className="text-blue-400 text-sm font-bold uppercase tracking-widest mb-6">Seviye {currentLevelIndex} Tamamlandı</p>
              <div className="bg-white/5 rounded-2xl p-4 mb-8">
                <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Kazanılan Skor</p>
                <p className="text-2xl font-bold text-white">{score.toLocaleString()}</p>
              </div>
              <button onClick={nextLevel} className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black tracking-widest transition-all shadow-lg">SONRAKİ SEVİYE</button>
              <button
                onClick={() => setAppState(AppState.MAP)}
                className="w-full mt-3 py-3 rounded-2xl bg-white/5 text-white/40 text-[10px] font-bold tracking-widest uppercase"
              >Haritaya Dön</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {unlockedAchievementId && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-amber-500 text-gray-900 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[280px]"
          >
            <div className="w-10 h-10 bg-white/30 rounded-full flex items-center justify-center text-xl">🏅</div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Başarım Açıldı!</span>
              <span className="font-bold">{achievements.find(a => a.id === unlockedAchievementId)?.name}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isGameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-gray-800 border border-white/8 p-6 md:p-8 rounded-2xl shadow-2xl max-w-xs w-full text-center relative overflow-hidden"
            >
              {(() => {
                const gameOverMsg = getGameOverMessage();
                return (
                  <>
                    <h2 className="text-2xl font-bold text-white mb-2">{gameOverMsg.title}</h2>
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">{gameOverMsg.subtitle}</p>
                    {gameOverMsg.description && (
                      <p className="text-gray-500 text-xs mb-4">{gameOverMsg.description}</p>
                    )}
                  </>
                );
              })()}
              <div className="w-12 h-0.5 bg-rose-500/60 mx-auto mb-5 rounded-full" />
              <div className="text-4xl font-bold text-white mb-8">{score.toLocaleString()}</div>
              <button
                onClick={() => gameMode === GameMode.CAREER ? resetGame() : initGame(gameMode)}
                className="w-full py-4 rounded-xl bg-rose-600 text-white font-semibold group transition-all"
              >
                <span className="group-active:scale-95 block">Tekrar Dene</span>
              </button>
              <button onClick={() => setAppState(AppState.HOME)} className="w-full mt-3 py-3 rounded-xl bg-white/5 text-white/40 text-[10px] font-bold uppercase">Ana Menüye Dön</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Theme Selector Modal */}
      <AnimatePresence>
        {showThemeSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowThemeSelector(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-800 border border-white/8 p-6 rounded-2xl shadow-2xl max-w-sm w-full"
            >
              <h2 className="text-2xl font-bold text-white mb-4 text-center">Tema Seç</h2>
              <p className="text-gray-400 text-xs text-center mb-6">Oyun masası görünümünü değiştir</p>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => { playClick(); setTheme('dark'); }}
                  className={clsx(
                    "p-4 rounded-xl border-2 transition-all",
                    currentTheme === 'dark' ? "border-blue-500 bg-blue-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                  )}
                >
                  <div className="w-full h-16 rounded-lg mb-2" style={{ background: 'linear-gradient(180deg, #111827 0%, #0f172a 100%)' }}></div>
                  <p className="text-white text-sm font-bold">Koyu</p>
                  <p className="text-gray-400 text-xs">Varsayılan</p>
                </button>
                
                <button
                  onClick={() => { playClick(); setTheme('light'); }}
                  className={clsx(
                    "p-4 rounded-xl border-2 transition-all",
                    currentTheme === 'light' ? "border-blue-500 bg-blue-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                  )}
                >
                  <div className="w-full h-16 rounded-lg mb-2" style={{ background: 'linear-gradient(180deg, #f9fafb 0%, #e5e7eb 100%)' }}></div>
                  <p className="text-white text-sm font-bold">Açık</p>
                  <p className="text-gray-400 text-xs">Parlak</p>
                </button>
                
                <button
                  onClick={() => { playClick(); setTheme('neon'); }}
                  className={clsx(
                    "p-4 rounded-xl border-2 transition-all",
                    currentTheme === 'neon' ? "border-blue-500 bg-blue-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                  )}
                >
                  <div className="w-full h-16 rounded-lg mb-2" style={{ background: 'linear-gradient(180deg, #0f0e17 0%, #1a0a2e 100%)' }}></div>
                  <p className="text-white text-sm font-bold">Neon</p>
                  <p className="text-gray-400 text-xs">Mor Ton</p>
                </button>
                
                <button
                  onClick={() => { playClick(); setTheme('ocean'); }}
                  className={clsx(
                    "p-4 rounded-xl border-2 transition-all",
                    currentTheme === 'ocean' ? "border-blue-500 bg-blue-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                  )}
                >
                  <div className="w-full h-16 rounded-lg mb-2" style={{ background: 'linear-gradient(180deg, #0a1929 0%, #0c1821 100%)' }}></div>
                  <p className="text-white text-sm font-bold">Okyanus</p>
                  <p className="text-gray-400 text-xs">Mavi Ton</p>
                </button>
              </div>
              
              <button
                onClick={() => { playClick(); setShowThemeSelector(false); }}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all"
              >
                Tamam
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;