/**
 * Special Block Mastery Card - Stats for bomb, ice, chrono blocks
 */

import React from 'react';
import { SpecialBlockStats } from '../types/analytics';

interface SpecialBlockMasteryCardProps {
  specialBlockStats: SpecialBlockStats;
}

export const SpecialBlockMasteryCard: React.FC<SpecialBlockMasteryCardProps> = ({ specialBlockStats }) => {
  const { bombStats, iceStats, chronoStats, specialBlockEfficiency } = specialBlockStats;
  
  return (
    <div
      className="rounded-2xl p-5 backdrop-blur-xl"
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">💎 Özel Blok Ustalığı</h3>
        <div
          className="px-3 py-1 rounded-lg text-xs font-bold"
          style={{
            background: 'rgba(168, 85, 247, 0.2)',
            color: '#a855f7',
            border: '1px solid rgba(168, 85, 247, 0.3)',
          }}
        >
          {specialBlockEfficiency}% Verimli
        </div>
      </div>
      
      {/* Bomb Stats */}
      <div
        className="mb-3 p-4 rounded-xl"
        style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">💣</span>
          <span className="text-sm font-bold text-red-400">BOMB</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-white/60 mb-1">Patlatılan</div>
            <div className="text-lg font-bold text-white">{bombStats.totalExploded}</div>
          </div>
          <div>
            <div className="text-xs text-white/60 mb-1">Ort. Etki</div>
            <div className="text-lg font-bold text-white">{bombStats.averageImpact}</div>
          </div>
        </div>
      </div>
      
      {/* Ice Stats */}
      <div
        className="mb-3 p-4 rounded-xl"
        style={{
          background: 'rgba(6, 182, 212, 0.1)',
          border: '1px solid rgba(6, 182, 212, 0.2)',
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🧊</span>
          <span className="text-sm font-bold text-cyan-400">ICE</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-white/60 mb-1">Kırılan</div>
            <div className="text-lg font-bold text-white">{iceStats.totalBroken}</div>
          </div>
          <div>
            <div className="text-xs text-white/60 mb-1">Ort. Süre</div>
            <div className="text-lg font-bold text-white">{iceStats.averageBreakTime}s</div>
          </div>
        </div>
      </div>
      
      {/* Chrono Stats */}
      <div
        className="p-4 rounded-xl"
        style={{
          background: 'rgba(249, 115, 22, 0.1)',
          border: '1px solid rgba(249, 115, 22, 0.2)',
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">⏱️</span>
          <span className="text-sm font-bold text-orange-400">CHRONO</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-white/60 mb-1">Toplanan</div>
            <div className="text-lg font-bold text-white">{chronoStats.totalCollected}</div>
          </div>
          <div>
            <div className="text-xs text-white/60 mb-1">Ort. Bonus</div>
            <div className="text-lg font-bold text-white">{Math.round(chronoStats.averageBonus)}s</div>
          </div>
        </div>
      </div>
    </div>
  );
};
