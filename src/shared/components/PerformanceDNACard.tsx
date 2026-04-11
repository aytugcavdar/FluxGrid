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
  const circumference = 2 * Math.PI * 45; // radius = 45
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
      <div className="mb-4">
        <p
          className="text-xs font-semibold tracking-wider uppercase"
          style={{ color: colors.textSecondary }}
        >
          İstatistiksel Genel Bakış
        </p>
        <h3
          className="text-lg font-bold"
          style={{ color: colors.textPrimary }}
        >
          Performance DNA
        </h3>
      </div>
      
      {/* Circular Progress Indicator */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative w-32 h-32">
          {/* Background circle */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="45"
              stroke={`${indexColor}20`}
              strokeWidth="8"
              fill="none"
            />
            {/* Progress circle */}
            <motion.circle
              cx="64"
              cy="64"
              r="45"
              stroke={indexColor}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p
              className="text-xs font-medium"
              style={{ color: colors.textSecondary }}
            >
              SPECTRAL INDEX
            </p>
            <p
              className="text-3xl font-bold"
              style={{ color: indexColor }}
            >
              {displayIndex.toFixed(1)}
            </p>
          </div>
        </div>
      </div>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Win Rate */}
        <div
          className="rounded-lg p-3 text-center"
          style={{
            background: `${colors.cardBackgroundTransparent}`,
            border: `1px solid ${colors.cardBorderTransparent}`,
          }}
        >
          <p
            className="text-xs font-medium mb-1"
            style={{ color: colors.textSecondary }}
          >
            🎯 WIN RATE
          </p>
          <p
            className="text-lg font-bold"
            style={{ color: colors.textPrimary }}
          >
            {winRate}%
          </p>
        </div>
        
        {/* Total Sessions */}
        <div
          className="rounded-lg p-3 text-center"
          style={{
            background: `${colors.cardBackgroundTransparent}`,
            border: `1px solid ${colors.cardBorderTransparent}`,
          }}
        >
          <p
            className="text-xs font-medium mb-1"
            style={{ color: colors.textSecondary }}
          >
            🎮 SESSIONS
          </p>
          <p
            className="text-lg font-bold"
            style={{ color: colors.textPrimary }}
          >
            {totalSessions.toLocaleString('tr-TR')}
          </p>
        </div>
        
        {/* Active Days */}
        <div
          className="rounded-lg p-3 text-center"
          style={{
            background: `${colors.cardBackgroundTransparent}`,
            border: `1px solid ${colors.cardBorderTransparent}`,
          }}
        >
          <p
            className="text-xs font-medium mb-1"
            style={{ color: colors.textSecondary }}
          >
            📅 DAYS
          </p>
          <p
            className="text-lg font-bold"
            style={{ color: colors.textPrimary }}
          >
            {activeDays}
          </p>
        </div>
      </div>
    </GradientCardBase>
  );
};
