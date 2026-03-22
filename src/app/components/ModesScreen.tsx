import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { GameMode, AppState } from '@shared/types';
import { playClick } from '@utils/audio';

interface ModesScreenProps {
  onSelectMode: (mode: GameMode) => void;
  onBack: () => void;
  onNavigateToLevelMap: () => void;
}

export const ModesScreen: React.FC<ModesScreenProps> = ({
  onSelectMode,
  onBack,
  onNavigateToLevelMap,
}) => {
  const { t } = useTranslation();

  return (
    <motion.div
      key="modes"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-gray-900"
    >
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black text-white italic tracking-tight uppercase mb-2">{t('modes.title')}</h2>
        <p className="text-white/40 text-[10px] tracking-widest uppercase font-bold">{t('modes.subtitle')}</p>
      </div>

      <div className="w-full max-w-xs space-y-4">
        <button
          onClick={() => { playClick(); onNavigateToLevelMap(); }}
          className="group relative w-full p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-blue-600/10 hover:border-blue-500/30 transition-all text-left overflow-hidden"
        >
          <div className="relative z-10">
            <span className="block text-xl font-black text-white italic tracking-tight mb-1">{t('modes.career')}</span>
            <span className="block text-[10px] text-white/40 font-bold uppercase tracking-widest">{t('modes.careerSub')}</span>
          </div>
          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-3xl opacity-20 group-hover:opacity-100 transition-opacity">🗺️</div>
        </button>

        <button
          onClick={() => { playClick(); onSelectMode(GameMode.ENDLESS); }}
          className="group relative w-full p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-purple-600/10 hover:border-purple-500/30 transition-all text-left overflow-hidden"
        >
          <div className="relative z-10">
            <span className="block text-xl font-black text-white italic tracking-tight mb-1">{t('modes.endless')}</span>
            <span className="block text-[10px] text-white/40 font-bold uppercase tracking-widest">{t('modes.endlessSub')}</span>
          </div>
          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-3xl opacity-20 group-hover:opacity-100 transition-opacity">♾️</div>
        </button>

        <button
          onClick={() => { playClick(); onSelectMode(GameMode.TIMED); }}
          className="group relative w-full p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-amber-600/10 hover:border-amber-500/30 transition-all text-left overflow-hidden"
        >
          <div className="relative z-10">
            <span className="block text-xl font-black text-white italic tracking-tight mb-1">{t('modes.rush')}</span>
            <span className="block text-[10px] text-white/40 font-bold uppercase tracking-widest">{t('modes.rushSub')}</span>
          </div>
          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-3xl opacity-20 group-hover:opacity-100 transition-opacity">⚡</div>
        </button>

        <button
          onClick={() => { playClick(); onSelectMode(GameMode.DAILY_CHALLENGE); }}
          className="group relative w-full p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-amber-600/10 hover:border-amber-500/30 transition-all text-left overflow-hidden"
        >
          <div className="relative z-10">
            <span className="block text-xl font-black text-white italic tracking-tight mb-1">{t('modes.dailyChallenge')}</span>
            <span className="block text-[10px] text-white/40 font-bold uppercase tracking-widest">{t('modes.dailyChallengeSub')}</span>
          </div>
          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-3xl opacity-20 group-hover:opacity-100 transition-opacity">📅</div>
        </button>

        <button
          onClick={() => { playClick(); onBack(); }}
          className="w-full py-4 text-white/40 text-[10px] font-bold uppercase tracking-[0.3em] hover:text-white transition-colors"
        >
          {t('home.backButton')}
        </button>
      </div>
    </motion.div>
  );
};
