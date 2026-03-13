import React, { useEffect, useState, useRef } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { Grid } from '../features/game/components/Grid';
import { Piece } from '../features/game/components/Piece';
import { useGameStore } from '../features/game/store/gameStore';
import { useThemeStore } from '@shared/store/themeStore';
import { useAbilityStore } from '../features/abilities/store/abilityStore';
import { usePassiveAbilityStore } from '../features/abilities/store/passiveAbilityStore';
import { useProfileStore } from '../features/profile/store/profileStore';
import { HUD, ScorePopups, ChainCounter, PerfectBonus, SurgeFlash, ComboFlash, DragOverlay } from '@features/hud';
import { LevelMap } from '../features/career/components/LevelMap';
import { CareerPage } from '../features/career/components/CareerPage';
import { Tutorial, shouldShowTutorial } from '@shared/components';
import { AbilityPanel } from '../features/abilities/components/AbilityPanel';
import { ProfileView } from '../features/profile/components/ProfileView';
import { motion, AnimatePresence } from 'framer-motion';
import { unlockAudio, playGameOver, playClick } from '@utils/audio';
import clsx from 'clsx';
import { AppState, GameMode } from '@shared/types';

interface ScorePopup {
  id: number;
  value: number;
  combo: number;
}

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
    if ((gameMode !== GameMode.TIMED && gameMode !== GameMode.ZEN && gameMode !== GameMode.BLITZ && gameMode !== GameMode.SURVIVAL) || appState !== AppState.GAME || isGameOver) return;
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
                onClick={() => { playClick(); setAppState(AppState.LEVEL_MAP); }}
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
                onClick={() => { playClick(); setAppState(AppState.LEVEL_MAP); }}
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
                onClick={() => { playClick(); initGame(GameMode.ZEN); }}
                className="group relative w-full p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-purple-600/10 hover:border-purple-500/30 transition-all text-left overflow-hidden"
              >
                <div className="relative z-10">
                  <span className="block text-xl font-black text-white italic tracking-tight mb-1">ZEN</span>
                  <span className="block text-[10px] text-white/40 font-bold uppercase tracking-widest">Hedef yok. Süre yok. Sadece sen ve bloklar.</span>
                </div>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-3xl opacity-20 group-hover:opacity-100 transition-opacity">☁️</div>
              </button>

              <button
                onClick={() => { playClick(); initGame(GameMode.BLITZ); }}
                className="group relative w-full p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-red-600/10 hover:border-red-500/30 transition-all text-left overflow-hidden"
              >
                <div className="relative z-10">
                  <span className="block text-xl font-black text-white italic tracking-tight mb-1">BLITZ</span>
                  <span className="block text-[10px] text-white/40 font-bold uppercase tracking-widest">30 saniye. Her satır 2 saniye kazandırır.</span>
                </div>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-3xl opacity-20 group-hover:opacity-100 transition-opacity">⚡</div>
              </button>

              <button
                onClick={() => { playClick(); initGame(GameMode.SURVIVAL); }}
                className="group relative w-full p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-gray-600/10 hover:border-gray-500/30 transition-all text-left overflow-hidden"
              >
                <div className="relative z-10">
                  <span className="block text-xl font-black text-white italic tracking-tight mb-1">SURVIVAL</span>
                  <span className="block text-[10px] text-white/40 font-bold uppercase tracking-widest">Grid dolmadan önce temizle. Satırlar yükseliyor.</span>
                </div>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-3xl opacity-20 group-hover:opacity-100 transition-opacity">💀</div>
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

        {appState === AppState.LEVEL_MAP && (
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
            <header className="flex-none w-full max-w-4xl mx-auto" style={{ padding: '4px 6px' }}>
              <div style={{ height: '38px' }}>
                <HUD />
              </div>
            </header>

            {/* Grid Area */}
            <main className="flex-1 relative flex items-center justify-center min-h-0 overflow-hidden">
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-full h-full max-w-[100vw] max-h-[100%]" style={{ aspectRatio: '1/1' }}>
                  <Grid />
                </div>
              </div>
            </main>

            {/* Piece Tray */}
            <div className="bg-gradient-to-t from-gray-900/90 via-gray-900/50 to-transparent" style={{ height: '80px', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
              <div className="max-w-2xl mx-auto h-full flex flex-col" style={{ padding: '2px 8px' }}>
                <div className="grid grid-cols-3 flex-1 min-h-0" style={{ gap: '4px' }}>
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
                        style={{ minHeight: '44px', borderRadius: '8px' }}
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
                onClick={() => setAppState(AppState.LEVEL_MAP)}
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

const AppWithErrorBoundary: React.FC = () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

export default AppWithErrorBoundary;