/**
 * Combo Distribution Card - Histogram showing combo frequency
 */

import React from 'react';
import { ComboAnalytics } from '../types/analytics';

interface ComboDistributionCardProps {
  comboAnalytics: ComboAnalytics;
}

export const ComboDistributionCard: React.FC<ComboDistributionCardProps> = ({ comboAnalytics }) => {
  const { maxCombo, averageCombo, comboDistribution, comboEfficiency } = comboAnalytics;
  
  // Convert distribution to array and sort
  const distributionArray = Object.entries(comboDistribution)
    .map(([combo, count]) => ({ combo: parseInt(combo), count }))
    .sort((a, b) => a.combo - b.combo);
  
  const maxCount = Math.max(...distributionArray.map(d => d.count), 1);
  
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
        <h3 className="text-lg font-bold text-white">⚡ Combo Analizi</h3>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div
          className="p-3 rounded-xl"
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
          }}
        >
          <div className="text-xs text-white/60 mb-1">Max Combo</div>
          <div className="text-xl font-bold text-red-400">{maxCombo}x</div>
        </div>
        
        <div
          className="p-3 rounded-xl"
          style={{
            background: 'rgba(249, 115, 22, 0.1)',
            border: '1px solid rgba(249, 115, 22, 0.2)',
          }}
        >
          <div className="text-xs text-white/60 mb-1">Ortalama</div>
          <div className="text-xl font-bold text-orange-400">{averageCombo}x</div>
        </div>
        
        <div
          className="p-3 rounded-xl"
          style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
          }}
        >
          <div className="text-xs text-white/60 mb-1">Verimlilik</div>
          <div className="text-xl font-bold text-green-400">{comboEfficiency}%</div>
        </div>
      </div>
      
      {/* Histogram */}
      <div>
        <div className="text-xs font-bold text-white/60 mb-3">📊 Dağılım</div>
        <div className="space-y-2">
          {distributionArray.length > 0 ? (
            distributionArray.map((data, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-white/60 w-12">{data.combo}x</span>
                <div className="flex-1 h-8 rounded-lg overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                  <div
                    className="h-full transition-all duration-500 flex items-center justify-end pr-2"
                    style={{
                      width: `${(data.count / maxCount) * 100}%`,
                      background: 'linear-gradient(90deg, #ef4444, #f97316)',
                    }}
                  >
                    {data.count > 0 && (
                      <span className="text-xs font-bold text-white">{data.count}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-white/40 text-sm py-4">
              Henüz veri yok
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
