import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import clsx from 'clsx';
import { GameMode } from '@shared/types';
import { playClick } from '@utils/audio';
import { generateShareText, shareResult } from '@utils/shareResult';

interface GameOverModalProps {
  isGameOver: boolean;
  score: number;
  displayScore: number;
  highScore: number;
  currentModeHighScore: number;
  isNewRecord: boolean;
  showRecordBadge: boolean;
  showButtons: boolean;
  gameMode: GameMode;
  combo: number;
  maxCombo: number;
  chronoBonus: number;
  finalSprintBonus: number;
  stats: any;
  surgeWasUsed: boolean;
  dailyClearHistory: boolean[][];
  shareStatus: 'idle' | 'copied' | 'shared';
  showPWAPrompt: boolean;
  showIOSInstructions: boolean;
  showLoginPrompt: boolean; // NEW - Requirement 4.2
  onClose: () => void;
  onPlayAgain: () => void;
  onTryMode: (mode: GameMode) => void;
  onShare: () => Promise<void>;
  onInstallPWA: () => Promise<void>;
  onCloseIOSInstructions: () => void;
  onSignIn: () => Promise<void>; // NEW - Requirement 4.4
}

// Helper function to get mode icon
const getModeIcon = (mode: GameMode): string => {
  const icons: Record<GameMode, string> = {
    [GameMode.ENDLESS]: '∞',
    [GameMode.TIMED]: '⚡',
    [GameMode.ZEN]: '☁️',
    [GameMode.DAILY_CHALLENGE]: '📅',
  };
  return icons[mode] || '🎮';
};

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isGameOver,
  score,
  displayScore,
  highScore,
  currentModeHighScore,
  isNewRecord,
  showRecordBadge,
  showButtons,
  gameMode,
  combo,
  maxCombo,
  chronoBonus,
  finalSprintBonus,
  stats,
  surgeWasUsed,
  dailyClearHistory,
  shareStatus,
  showPWAPrompt,
  showIOSInstructions,
  showLoginPrompt, // NEW
  onClose,
  onPlayAgain,
  onTryMode,
  onShare,
  onInstallPWA,
  onCloseIOSInstructions,
  onSignIn, // NEW
}) => {
  if (!isGameOver) return null;

  // Mode suggestions
  const MODE_SUGGESTIONS: Record<string, { mode: GameMode; label: string; desc: string }> = {
    [GameMode.ENDLESS]: { mode: GameMode.TIMED, label: 'Zamanlı Modu Dene', desc: '60 saniye içinde en yüksek skoru yap' },
    [GameMode.TIMED]: { mode: GameMode.ZEN, label: 'Zen Modunu Dene', desc: 'Stressiz, zamansız oyun deneyimi' },
    [GameMode.ZEN]: { mode: GameMode.ENDLESS, label: 'Sonsuz Modu Dene', desc: 'Sınırsız oyun, skor rekorları kır' },
    [GameMode.DAILY_CHALLENGE]: { mode: GameMode.ENDLESS, label: 'Sonsuz Modu Dene', desc: 'Günlük meydan okuma sonrası pratik yap' },
  };
  const suggestion = MODE_SUGGESTIONS[gameMode];

  return (
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
        {/* Header Section */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getModeIcon(gameMode)}</span>
            <span className="text-xs text-gray-400 uppercase tracking-wider">
              Oyun Bitti
            </span>
          </div>
          <button
            onClick={() => {
              playClick();
              onClose();
            }}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Score Display with Count-Up Animation */}
        <div className="text-center my-6">
          <div 
            className={clsx(
              "text-4xl font-bold transition-colors duration-300",
              isNewRecord ? "text-amber-400" : "text-white"
            )}
          >
            {displayScore.toLocaleString()}
          </div>
          
          {isNewRecord && showRecordBadge && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-amber-400 text-sm font-semibold"
            >
              🏆 Yeni Rekor!
            </motion.div>
          )}
          
          {!isNewRecord && currentModeHighScore > 0 && (
            <div className="mt-2 text-xs text-gray-400">
              En iyinin %{Math.round((score / currentModeHighScore) * 100)}'i
            </div>
          )}
        </div>

        {/* Share Preview - Emoji Grid */}
        {gameMode === GameMode.DAILY_CHALLENGE && dailyClearHistory.length > 0 && (
          <div className="mb-4 p-3 bg-white/5 rounded-lg">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2 text-center">
              Paylaşım Önizleme
            </div>
            <div style={{
              fontFamily: 'monospace',
              fontSize: 18,
              textAlign: 'center',
              letterSpacing: 4,
              lineHeight: 1.3
            }}>
              {generateShareText(score, gameMode, combo, surgeWasUsed, dailyClearHistory)
                .split('\n')
                .slice(2, -2)
                .map((line, i) => (
                  <div key={i}>{line || '\u00A0'}</div>
                ))}
            </div>
          </div>
        )}

        {/* Stats Chips */}
        {stats && (
          <div className="flex gap-2 mb-4">
            {gameMode === GameMode.TIMED ? (
              <>
                <div className="flex-1 bg-white/5 rounded-lg py-2 px-3">
                  <div className="text-sm font-bold text-amber-400">
                    {maxCombo > 0 ? `x${maxCombo}` : '--'}
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase">Max Combo</div>
                </div>
                <div className="flex-1 bg-white/5 rounded-lg py-2 px-3">
                  <div className="text-sm font-bold text-purple-400">
                    {stats.linesCleared || 0}
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase">Satır</div>
                </div>
                <div className="flex-1 bg-white/5 rounded-lg py-2 px-3">
                  <div className="text-sm font-bold text-blue-400">
                    +{chronoBonus}s
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase">Chrono</div>
                </div>
                {finalSprintBonus > 0 && (
                  <div className="flex-1 bg-white/5 rounded-lg py-2 px-3">
                    <div className="text-sm font-bold text-green-400">
                      +{finalSprintBonus}
                    </div>
                    <div className="text-[10px] text-gray-500 uppercase">Sprint</div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex-1 bg-white/5 rounded-lg py-2 px-3">
                  <div className="text-sm font-bold text-blue-400">
                    {maxCombo > 0 ? `x${maxCombo}` : '--'}
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase">Max Combo</div>
                </div>
                <div className="flex-1 bg-white/5 rounded-lg py-2 px-3">
                  <div className="text-sm font-bold text-purple-400">
                    {stats.linesCleared || 0}
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase">Satır</div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Best Score Comparison */}
        {!isNewRecord && currentModeHighScore > 0 && score > 0 && (
          <div className="mb-4 p-3 bg-white/5 rounded-lg text-center">
            <div className="text-xs text-gray-400 mb-1">
              Rekoruna %{Math.round((score / currentModeHighScore) * 100)} yaklaştın
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((score / currentModeHighScore) * 100, 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
              />
            </div>
          </div>
        )}

        {/* Primary Action Button - Tekrar Oyna */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: showButtons ? 1 : 0 }}
          onClick={() => {
            playClick();
            onPlayAgain();
          }}
          className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all active:scale-95"
        >
          Tekrar Oyna
        </motion.button>

        {/* Share Result Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: showButtons ? 1 : 0 }}
          onClick={onShare}
          className="w-full mt-2 py-3 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm font-semibold hover:bg-blue-500/20 transition-all"
        >
          {shareStatus === 'copied' ? '✓ Kopyalandı!' : shareStatus === 'shared' ? '✓ Paylaşıldı!' : '↗ Sonucu Paylaş'}
        </motion.button>

        {/* Login Prompt for Anonymous Users - Requirement 4.3, 4.4 */}
        {showLoginPrompt && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={async () => {
              playClick();
              await onSignIn();
            }}
            className="w-full mt-3 py-3 px-4 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 transition-all flex items-center gap-3"
          >
            <div className="text-2xl">🏆</div>
            <div className="flex-1 text-left">
              <div className="text-sm font-semibold text-blue-400">
                Sıralamaya girmek için Google ile giriş yap
              </div>
              <div className="text-xs text-blue-400/60">
                Skorunu kaydet ve sıralamada yerini al
              </div>
            </div>
          </motion.button>
        )}

        {/* Mode Suggestion */}
        {suggestion && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: showButtons ? 1 : 0 }}
            onClick={() => { playClick(); onTryMode(suggestion.mode); }}
            className="w-full mt-2 py-2 px-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all flex items-center gap-2 text-left"
          >
            <div className="flex-1">
              <div className="text-xs font-semibold text-gray-400">
                {suggestion.label}
              </div>
              <div className="text-[10px] text-gray-500">
                {suggestion.desc}
              </div>
            </div>
            <div className="text-xs text-gray-500">→</div>
          </motion.button>
        )}

        {/* PWA Install Prompt - Non-iOS */}
        {showPWAPrompt && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={async () => {
              playClick();
              await onInstallPWA();
            }}
            className="w-full mt-3 py-2 px-3 rounded-lg border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 transition-all flex items-center gap-2"
          >
            <div className="text-lg">📱</div>
            <div className="flex-1 text-left">
              <div className="text-xs font-semibold text-blue-400">
                Ana Ekrana Ekle
              </div>
              <div className="text-[10px] text-blue-400/60">
                Hızlı erişim için
              </div>
            </div>
          </motion.button>
        )}

        {/* iOS PWA Instructions */}
        {showIOSInstructions && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-3 rounded-lg border border-blue-500/30 bg-blue-500/10 text-left"
          >
            <div className="flex items-start gap-2 mb-2">
              <div className="text-lg">📱</div>
              <div className="flex-1">
                <div className="text-xs font-semibold text-blue-400 mb-1">
                  Ana Ekrana Ekle
                </div>
                <div className="text-[10px] text-blue-400/80 leading-relaxed">
                  Safari'de <span className="font-bold">Paylaş</span> butonuna bas, sonra <span className="font-bold">Ana Ekrana Ekle</span>'yi seç
                </div>
              </div>
              <button
                onClick={onCloseIOSInstructions}
                className="text-blue-400/60 hover:text-blue-400"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};
