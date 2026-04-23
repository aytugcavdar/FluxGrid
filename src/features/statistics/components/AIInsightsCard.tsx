/**
 * AI Insights Card - AI-powered recommendations and predictions
 */

import React from 'react';
import { AIInsights } from '../types/analytics';

interface AIInsightsCardProps {
  aiInsights: AIInsights;
}

export const AIInsightsCard: React.FC<AIInsightsCardProps> = ({ aiInsights }) => {
  const { strengths, improvements, predictions, patterns } = aiInsights;
  
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
        <h3 className="text-lg font-bold text-white">🤖 AI Önerileri</h3>
      </div>
      
      {/* Strengths */}
      {strengths.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-bold text-white/60 mb-2">💪 Güçlü Yönler</div>
          <div className="space-y-2">
            {strengths.map((strength, i) => (
              <div
                key={i}
                className="p-3 rounded-xl"
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="text-sm font-bold text-green-400 mb-1">{strength.title}</div>
                    <div className="text-xs text-white/70">{strength.description}</div>
                  </div>
                  <div className="text-xs text-green-400 font-bold">{strength.confidence}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Improvements */}
      {improvements.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-bold text-white/60 mb-2">📈 Gelişim Alanları</div>
          <div className="space-y-2">
            {improvements.map((improvement, i) => {
              const priorityColors = {
                high: { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.2)', text: '#ef4444' },
                medium: { bg: 'rgba(249, 115, 22, 0.1)', border: 'rgba(249, 115, 22, 0.2)', text: '#f97316' },
                low: { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.2)', text: '#3b82f6' },
              };
              const colors = priorityColors[improvement.priority];
              
              return (
                <div
                  key={i}
                  className="p-3 rounded-xl"
                  style={{
                    background: colors.bg,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="text-sm font-bold" style={{ color: colors.text }}>
                      {improvement.title}
                    </div>
                    <div
                      className="px-2 py-0.5 rounded text-xs font-bold"
                      style={{
                        background: colors.border,
                        color: colors.text,
                      }}
                    >
                      {improvement.priority.toUpperCase()}
                    </div>
                  </div>
                  <div className="text-xs text-white/70 mb-1">{improvement.suggestion}</div>
                  <div className="text-xs font-bold" style={{ color: colors.text }}>
                    💎 {improvement.potentialGain}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Predictions */}
      {predictions && (
        <div className="mb-4">
          <div className="text-xs font-bold text-white/60 mb-2">🔮 Tahminler</div>
          <div
            className="p-3 rounded-xl"
            style={{
              background: 'rgba(168, 85, 247, 0.1)',
              border: '1px solid rgba(168, 85, 247, 0.2)',
            }}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="text-sm font-bold text-purple-400">Sonraki Hedef</div>
              <div className="text-xs text-purple-400 font-bold">{predictions.confidence}% güven</div>
            </div>
            <div className="text-lg font-bold text-white mb-1">{predictions.nextMilestone}</div>
            <div className="text-xs text-white/70">{predictions.estimatedDate}</div>
          </div>
        </div>
      )}
      
      {/* Patterns */}
      {patterns.length > 0 && (
        <div>
          <div className="text-xs font-bold text-white/60 mb-2">🔍 Tespit Edilen Desenler</div>
          <div className="space-y-2">
            {patterns.map((pattern, i) => {
              const typeColors = {
                positive: { icon: '✅', color: '#10b981' },
                negative: { icon: '⚠️', color: '#ef4444' },
                neutral: { icon: 'ℹ️', color: '#6b7280' },
              };
              const { icon, color } = typeColors[pattern.type];
              
              return (
                <div
                  key={i}
                  className="flex items-start gap-2 p-2 rounded-lg"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                  }}
                >
                  <span className="text-sm">{icon}</span>
                  <div className="flex-1">
                    <div className="text-xs text-white/80">{pattern.description}</div>
                    <div className="text-xs text-white/50 mt-1">Sıklık: {pattern.frequency}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Empty State */}
      {strengths.length === 0 && improvements.length === 0 && patterns.length === 0 && (
        <div className="text-center text-white/40 text-sm py-8">
          Daha fazla oyun oynayarak AI önerilerini açın! 🎮
        </div>
      )}
    </div>
  );
};
