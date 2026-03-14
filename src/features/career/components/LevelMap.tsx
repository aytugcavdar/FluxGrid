import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../game/store/gameStore';
import { generateLevel } from '../utils/levelGenerator';
import { AppState } from '@shared/types';
import { Trophy, ChevronLeft } from 'lucide-react';
import { playClick } from '../../../utils/audio';
import { safeParseInt } from '../../game/store/helpers/localStorage';

// Generate 100 levels for the map display
const MAP_LEVELS = Array.from({ length: 100 }, (_, i) => generateLevel(i + 1));

// Region definitions
const REGIONS = [
  {
    id: 'start',
    label: 'Başlangıç',
    range: [1, 10] as [number, number],
    color: '#3b82f6',
    bgColor: 'rgba(59,130,246,0.08)',
    borderColor: 'rgba(59,130,246,0.2)',
    subtitle: 'Temel mekanikler'
  },
  {
    id: 'mid',
    label: 'Gelişim',
    range: [11, 30] as [number, number],
    color: '#10b981',
    bgColor: 'rgba(16,185,129,0.08)',
    borderColor: 'rgba(16,185,129,0.2)',
    subtitle: 'Satır temizleme'
  },
  {
    id: 'hard',
    label: 'Zorluk',
    range: [31, 60] as [number, number],
    color: '#a78bfa',
    bgColor: 'rgba(167,139,250,0.08)',
    borderColor: 'rgba(167,139,250,0.2)',
    subtitle: 'Buz + Zincir'
  },
  {
    id: 'expert',
    label: 'Uzman',
    range: [61, 85] as [number, number],
    color: '#f59e0b',
    bgColor: 'rgba(245,158,11,0.08)',
    borderColor: 'rgba(245,158,11,0.2)',
    subtitle: 'Bomba ustası'
  },
  {
    id: 'legend',
    label: 'Efsane',
    range: [86, 100] as [number, number],
    color: '#ef4444',
    bgColor: 'rgba(239,68,68,0.08)',
    borderColor: 'rgba(239,68,68,0.2)',
    subtitle: 'Tüm hedefler'
  }
];

const getRegion = (levelIndex: number) =>
  REGIONS.find(r => levelIndex >= r.range[0] && levelIndex <= r.range[1]) ?? REGIONS[0];

export const LevelMap: React.FC = () => {
  const { maxLevelReached, setAppState, startLevel } = useGameStore();

  const handleLevelClick = (idx: number) => {
    if (idx <= maxLevelReached || idx === maxLevelReached + 1) {
      playClick();
      startLevel(idx);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 z-[40] overflow-y-auto overflow-x-hidden no-scrollbar pb-32">
      {/* Header */}
      <div className="sticky top-0 bg-gray-900/80 backdrop-blur-md z-10 px-6 py-8 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-4">
          <button
            onClick={() => { playClick(); setAppState(AppState.HOME); }}
            className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/60 hover:text-white"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight italic">GÖREV HARİTASI</h1>
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">FluxGrid Macerası</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
          <Trophy size={14} className="text-amber-400" />
          <span className="text-sm font-bold text-white tracking-widest">{maxLevelReached}</span>
        </div>
      </div>

      {/* Map Content */}
      <div className="max-w-md mx-auto px-6 py-8 relative min-h-screen">
        {/* Total Progress Bar */}
        <div style={{ padding: '0 10px', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Toplam ilerleme</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
              {Math.min(maxLevelReached, 100)}/100
            </span>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, (maxLevelReached / 100) * 100)}%`,
                background: 'linear-gradient(90deg, #3b82f6, #10b981, #a78bfa, #f59e0b, #ef4444)',
                borderRadius: 2,
                transition: 'width .5s ease'
              }}
            />
          </div>
        </div>

        {/* Regions */}
        {REGIONS.map(region => {
          const regionLevels = MAP_LEVELS.filter(
            l => l.index >= region.range[0] && l.index <= region.range[1]
          );
          const completedInRegion = regionLevels.filter(l => l.index < maxLevelReached + 1).length;
          const totalInRegion = regionLevels.length;

          return (
            <div key={region.id} style={{ marginBottom: 32 }}>
              {/* Region Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 16px',
                  marginBottom: 12,
                  background: region.bgColor,
                  border: `0.5px solid ${region.borderColor}`,
                  borderRadius: 12
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: region.color }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: region.color }}>
                    {region.label}
                  </div>
                  <div style={{ fontSize: 9, color: `${region.color}80`, marginTop: 1 }}>
                    {region.subtitle} · {region.range[0]}-{region.range[1]}. seviye
                  </div>
                </div>
                {/* Region Progress */}
                <div style={{ fontSize: 10, color: `${region.color}70` }}>
                  {completedInRegion}/{totalInRegion}
                </div>
              </div>

              {/* Animated Path Line for this region */}
              <div className="relative">
                <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-white/[0.03] -translate-x-1/2" />

                {/* Region Levels */}
                <div className="flex flex-col gap-16 relative z-10">
                  {regionLevels.map((level, i) => {
                    const isUnlocked = level.index <= maxLevelReached + 1;
                    const isCurrent = level.index === maxLevelReached + 1;
                    const isLeft = i % 2 === 0;
                    const levelStars = safeParseInt(
                      localStorage.getItem(`flux_level_${level.index}_stars`) || '0'
                    );

                    return (
                      <motion.div
                        key={level.index}
                        initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: '-50px' }}
                        transition={{ delay: 0.05 }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          width: '100%',
                          flexDirection: isLeft ? 'row' : 'row-reverse',
                          position: 'relative'
                        }}
                      >
                        {/* Level Button */}
                        <button
                          onClick={() => handleLevelClick(level.index)}
                          disabled={!isUnlocked}
                          style={{
                            width: 72,
                            height: 72,
                            borderRadius: 20,
                            background: isUnlocked ? region.bgColor : 'rgba(255,255,255,0.02)',
                            border: isUnlocked
                              ? `2px solid ${isCurrent ? region.color : region.borderColor}`
                              : '2px solid rgba(255,255,255,0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: isUnlocked ? 'pointer' : 'not-allowed',
                            transition: 'all .2s',
                            position: 'relative'
                          }}
                        >
                          {/* Pulse animation for current level */}
                          {isCurrent && (
                            <motion.div
                              style={{
                                position: 'absolute',
                                inset: 0,
                                borderRadius: 20,
                                background: region.color,
                                opacity: 0.15
                              }}
                              animate={{ opacity: [0.15, 0.05, 0.15] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                          )}

                          {isUnlocked ? (
                            <>
                              <span
                                style={{
                                  fontSize: 18,
                                  fontWeight: 700,
                                  color: region.color,
                                  lineHeight: 1
                                }}
                              >
                                {level.index}
                              </span>
                              {/* Stars */}
                              <div style={{ display: 'flex', gap: 1, marginTop: 2 }}>
                                {[1, 2, 3].map(s => (
                                  <svg key={s} width="7" height="7" viewBox="0 0 10 10">
                                    <polygon
                                      points="5,0 6.5,3.5 10,3.5 7.5,6 8.5,10 5,7.5 1.5,10 2.5,6 0,3.5 3.5,3.5"
                                      fill={levelStars >= s ? '#f59e0b' : 'rgba(255,255,255,0.1)'}
                                    />
                                  </svg>
                                ))}
                              </div>
                            </>
                          ) : (
                            <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
                              <rect
                                x="2"
                                y="8"
                                width="12"
                                height="11"
                                rx="2"
                                fill="rgba(255,255,255,0.08)"
                                stroke="rgba(255,255,255,0.1)"
                                strokeWidth="1"
                              />
                              <path
                                d="M4 8V6C4 3.8 5.8 2 8 2C10.2 2 12 3.8 12 6V8"
                                stroke="rgba(255,255,255,0.15)"
                                strokeWidth="1.5"
                                fill="none"
                              />
                            </svg>
                          )}
                        </button>

                        {/* Level Name Tooltip */}
                        <div
                          style={{
                            position: 'absolute',
                            [isLeft ? 'left' : 'right']: '100%',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            [isLeft ? 'paddingLeft' : 'paddingRight']: 10,
                            whiteSpace: 'nowrap',
                            pointerEvents: 'none'
                          }}
                        >
                          {isUnlocked && (
                            <div style={{ fontSize: 9, color: `${region.color}70`, fontWeight: 500 }}>
                              {level.name}
                            </div>
                          )}
                          {!isUnlocked && (
                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>
                              Seviye {level.index - 1}'i tamamla
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}

        {/* Coming Soon Node */}
        <div className="w-full flex justify-center mt-8">
          <div className="px-6 py-2 rounded-full bg-white/5 border border-white/5 text-[9px] font-black text-white/20 tracking-widest uppercase">
            YAKINDA YENİ SEVİYELER...
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-gray-900 via-gray-900 to-transparent z-20">
        <div className="max-w-md mx-auto flex gap-4">
          <button
            onClick={() => { playClick(); setAppState(AppState.CAREER); }}
            className="flex-1 py-4 rounded-2xl bg-gray-800 border border-white/10 text-white font-black tracking-widest text-xs uppercase hover:bg-gray-700 transition-colors"
          >
            KARİYER
          </button>
        </div>
      </div>
    </div>
  );
};
