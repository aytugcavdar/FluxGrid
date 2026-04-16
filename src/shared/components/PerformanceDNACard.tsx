import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useThemeStore } from '../store/themeStore';
import { GradientCardBase } from './GradientCardBase';

export interface PerformanceDNACardProps {
  spectralIndex: number; // 0-100 with 1 decimal
  winRate: number; // 0-100
  totalSessions: number;
  activeDays: number;
  gradient: string;
}

export const PerformanceDNACard: React.FC<PerformanceDNACardProps> = ({
  spectralIndex,
  winRate,
  totalSessions,
  activeDays,
  gradient,
}) => {
  const { getThemeColors } = useThemeStore();
  const colors = getThemeColors();
  
  // Count-up animation state
  const [displayIndex, setDisplayIndex] = useState(0);
  
  // Detect reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
  
  // Count-up animation effect
  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayIndex(spectralIndex);
      return;
    }
    
    const duration = 1000; // 1 second
    const steps = 60;
    const increment = spectralIndex / steps;
    let current = 0;
    let step = 0;
    
    const timer = setInterval(() => {
      step++;
      current = Math.min(spectralIndex, current + increment);
      setDisplayIndex(current);
      
      if (step >= steps || current >= spectralIndex) {
        setDisplayIndex(spectralIndex);
        clearInterval(timer);
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [spectralIndex, prefersReducedMotion]);
  
  // Calculate circle progress (0-1)
  const progress = spectralIndex / 100;
  const circumference = 2 * Math.PI * 60; // radius = 60
  const strokeDashoffset = circumference * (1 - progress);
  
  // Determine color based on index
  const getIndexColor = (index: number): string => {
    if (index >= 80) return '#10b981'; // green
    if (index >= 60) return '#3b82f6'; // blue
    if (index >= 40) return '#f59e0b'; // orange
    return '#ef4444'; // red
  };
  
  const indexColor = getIndexColor(spectralIndex);
  
  return (
    <GradientCardBase
      gradient={gradient}
      borderColor="rgba(59,130,246,0.3)"
      glowColor="rgba(59,130,246,0.2)"
      className="p-6"
      hoverScale={1.01}
      animateOnMount={true}
    >
      {/* Header */}
      <div className="mb-6">
        <p
          className="text-xs font-semibold tracking-widest uppercase mb-1"
          style={{ color: colors.textSecondary, opacity: 0.6 }}
        >
          İstatistiksel Genel Bakış
        </p>
        <h3
          className="text-xl font-bold"
          style={{ color: colors.textPrimary }}
        >
          Performance DNA
        </h3>
      </div>
      
      {/* Circular Progress Indicator */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative w-40 h-40">
          {/* Outer glow effect */}
          <div 
            className="absolute inset-0 rounded-full blur-xl opacity-20"
            style={{ background: indexColor }}
          />
          
          {/* Background circle */}
          <svg className="w-full h-full transform -rotate-90 relative z-10">
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={indexColor} stopOpacity="0.2" />
                <stop offset="100%" stopColor={indexColor} stopOpacity="0.05" />
              </linearGradient>
              <linearGradient id="mainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={indexColor} />
                <stop offset="100%" stopColor={indexColor} stopOpacity="0.7" />
              </linearGradient>
            </defs>
            <circle
              cx="80"
              cy="80"
              r="60"
              stroke="url(#progressGradient)"
              strokeWidth="10"
              fill="none"
            />
            {/* Progress circle */}
            <motion.circle
              cx="80"
              cy="80"
              r="60"
              stroke="url(#mainGradient)"
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            />
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
            <p
              className="text-xs font-semibold tracking-wider uppercase mb-1"
              style={{ color: colors.textSecondary, opacity: 0.5 }}
            >
              SPECTRAL INDEX
            </p>
            <motion.p
              className="text-4xl font-black"
              style={{ color: indexColor }}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {displayIndex.toFixed(1)}
            </motion.p>
          </div>
        </div>
      </div>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Win Rate */}
        <div
          className="rounded-xl p-3 text-center"
          style={{
            background: `${colors.cardBackgroundTransparent}`,
            border: `1px solid ${colors.cardBorderTransparent}`,
          }}
        >
          <div className="text-xl mb-1">🎯</div>
          <p
            className="text-xs font-semibold tracking-wider uppercase mb-1"
            style={{ color: colors.textSecondary, opacity: 0.6 }}
          >
            WIN RATE
          </p>
          <p
            className="text-xl font-black"
            style={{ color: colors.textPrimary }}
          >
            {winRate}%
          </p>
        </div>
        
        {/* Total Sessions */}
        <div
          className="rounded-xl p-3 text-center"
          style={{
            background: `${colors.cardBackgroundTransparent}`,
            border: `1px solid ${colors.cardBorderTransparent}`,
          }}
        >
          <div className="text-xl mb-1">🎮</div>
          <p
            className="text-xs font-semibold tracking-wider uppercase mb-1"
            style={{ color: colors.textSecondary, opacity: 0.6 }}
          >
            SESSIONS
          </p>
          <p
            className="text-xl font-black"
            style={{ color: colors.textPrimary }}
          >
            {totalSessions.toLocaleString('tr-TR')}
          </p>
        </div>
        
        {/* Active Days */}
        <div
          className="rounded-xl p-3 text-center"
          style={{
            background: `${colors.cardBackgroundTransparent}`,
            border: `1px solid ${colors.cardBorderTransparent}`,
          }}
        >
          <div className="text-xl mb-1">📅</div>
          <p
            className="text-xs font-semibold tracking-wider uppercase mb-1"
            style={{ color: colors.textSecondary, opacity: 0.6 }}
          >
            DAYS
          </p>
          <p
            className="text-xl font-black"
            style={{ color: colors.textPrimary }}
          >
            {activeDays}
          </p>
        </div>
      </div>
    </GradientCardBase>
  );
};
