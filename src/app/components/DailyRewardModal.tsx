import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDailyRewardStore, RewardDefinition, WEEKLY_REWARDS } from '@shared/store/dailyRewardStore';

interface DailyRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RewardCalendarProps {
  rewards: RewardDefinition[];
  currentStreak: number;
}

interface RewardDayCardProps {
  reward: RewardDefinition;
  status: 'past' | 'current' | 'future';
}

// Confetti Effect Component
const ConfettiEffect: React.FC = () => {
  return (
    <>
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        
        .confetti-piece {
          position: absolute;
          width: 10px;
          height: 10px;
          background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #f7b731);
          animation: confetti-fall 2s ease-out forwards;
        }
      `}</style>
      <div className="fixed inset-0 pointer-events-none z-[80]">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="confetti-piece"
            style={{
              left: `${10 + i * 12}%`,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
    </>
  );
};

// Reward Day Card Component
const RewardDayCard: React.FC<RewardDayCardProps> = ({ reward, status }) => {
  const opacity = status === 'past' ? 0.4 : status === 'current' ? 1.0 : 0.6;
  const borderClass = status === 'current' 
    ? 'border-2 border-purple-500 shadow-lg shadow-purple-500/50' 
    : 'border border-gray-600';
  
  return (
    <div
      className={`rounded-lg p-2 text-center ${borderClass}`}
      style={{ opacity }}
    >
      <div className="text-2xl">{reward.icon}</div>
      <div className="text-xs mt-1 text-gray-400">Gün {reward.day}</div>
      {status === 'past' && <div className="text-green-400 text-lg">✓</div>}
    </div>
  );
};

// Reward Calendar Component
const RewardCalendar: React.FC<RewardCalendarProps> = ({ rewards, currentStreak }) => {
  return (
    <div className="grid grid-cols-7 gap-2">
      {rewards.map((reward) => {
        const status = 
          reward.day < currentStreak ? 'past' :
          reward.day === currentStreak ? 'current' :
          'future';
        
        return (
          <RewardDayCard key={reward.day} reward={reward} status={status} />
        );
      })}
    </div>
  );
};

// Main Modal Component
export const DailyRewardModal: React.FC<DailyRewardModalProps> = ({ isOpen, onClose }) => {
  const { currentStreak, canClaimToday, currentReward, claimDailyReward, streakBroken, clearStreakBrokenFlag } = useDailyRewardStore();
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Detect reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;
  
  const handleClaim = () => {
    claimDailyReward();
    setShowConfetti(true);
    
    // Auto-close after 2 seconds
    setTimeout(() => {
      onClose();
      setShowConfetti(false);
      clearStreakBrokenFlag();
    }, 2000);
  };
  
  const handleClose = () => {
    onClose();
    clearStreakBrokenFlag();
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[60]"
            onClick={handleClose}
          />
          
          {/* Modal Card */}
          <motion.div
            initial={{ scale: prefersReducedMotion ? 1 : 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: prefersReducedMotion ? 1 : 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed inset-0 flex items-center justify-center p-4 z-[70] pointer-events-none"
          >
            <div className="bg-gray-800 border border-white/10 rounded-2xl p-6 max-w-md w-full pointer-events-auto">
              {/* Title */}
              <h2 className="text-2xl font-bold text-center mb-4 text-white">
                Günlük Ödül!
              </h2>
              
              {/* Streak Broken Notification */}
              {streakBroken && (
                <div className="bg-orange-500/20 border border-orange-500 rounded-lg p-2 mb-4 text-center">
                  <span className="text-orange-400">Streak kırıldı!</span>
                </div>
              )}
              
              {/* Reward Calendar */}
              <RewardCalendar rewards={WEEKLY_REWARDS} currentStreak={currentStreak} />
              
              {/* Current Reward Display */}
              <motion.div
                animate={prefersReducedMotion ? {} : { scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                className="text-center my-6"
              >
                <div className="text-6xl mb-2">{currentReward.icon}</div>
                <div className="text-xl font-bold text-white">{currentReward.label}</div>
              </motion.div>
              
              {/* Claim Button or "Come Back Tomorrow" */}
              {canClaimToday ? (
                <button
                  onClick={handleClaim}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
                >
                  AL!
                </button>
              ) : (
                <div className="text-center text-gray-400">
                  Yarın Gel
                </div>
              )}
              
              {/* Confetti Animation */}
              {showConfetti && !prefersReducedMotion && <ConfettiEffect />}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
