/**
 * Performance DNA Card - Radar Chart showing player skills
 */

import React from 'react';
import { PlayerDNA } from '../types/analytics';

interface PerformanceDNACardProps {
  dna: PlayerDNA;
}

export const PerformanceDNACard: React.FC<PerformanceDNACardProps> = ({ dna }) => {
  const { playStyle, strengths, weaknesses, recommendations, skillRating } = dna;
  
  // Radar chart points
  const skills = [
    { name: 'Speed', value: skillRating.speed, angle: 0 },
    { name: 'Accuracy', value: skillRating.accuracy, angle: 72 },
    { name: 'Strategy', value: skillRating.strategy, angle: 144 },
    { name: 'Consistency', value: skillRating.consistency, angle: 216 },
    { name: 'Adaptability', value: skillRating.adaptability, angle: 288 },
  ];
  
  // Calculate radar chart polygon points
  const centerX = 100;
  const centerY = 100;
  const maxRadius = 80;
  
  const points = skills.map(skill => {
    const radius = (skill.value / 100) * maxRadius;
    const angleRad = (skill.angle - 90) * (Math.PI / 180);
    const x = centerX + radius * Math.cos(angleRad);
    const y = centerY + radius * Math.sin(angleRad);
    return `${x},${y}`;
  }).join(' ');
  
  // Grid circles
  const gridCircles = [20, 40, 60, 80, 100];
  
  // Play style colors
  const playStyleColors = {
    aggressive: '#ef4444',
    defensive: '#3b82f6',
    balanced: '#10b981',
    strategic: '#a855f7',
  };
  
  const accentColor = playStyleColors[playStyle];
  
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
        <h3 className="text-lg font-bold text-white">🧬 Performance DNA</h3>
        <div
          className="px-3 py-1 rounded-lg text-xs font-bold"
          style={{
            background: `${accentColor}20`,
            color: accentColor,
            border: `1px solid ${accentColor}40`,
          }}
        >
          {playStyle.toUpperCase()}
        </div>
      </div>
      
      {/* Radar Chart */}
      <div className="relative w-full aspect-square mb-4">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {/* Grid circles */}
          {gridCircles.map((radius, i) => (
            <circle
              key={i}
              cx={centerX}
              cy={centerY}
              r={(radius / 100) * maxRadius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="1"
            />
          ))}
          
          {/* Grid lines */}
          {skills.map((skill, i) => {
            const angleRad = (skill.angle - 90) * (Math.PI / 180);
            const x = centerX + maxRadius * Math.cos(angleRad);
            const y = centerY + maxRadius * Math.sin(angleRad);
            return (
              <line
                key={i}
                x1={centerX}
                y1={centerY}
                x2={x}
                y2={y}
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="1"
              />
            );
          })}
          
          {/* Data polygon */}
          <polygon
            points={points}
            fill={`${accentColor}30`}
            stroke={accentColor}
            strokeWidth="2"
          />
          
          {/* Data points */}
          {skills.map((skill, i) => {
            const radius = (skill.value / 100) * maxRadius;
            const angleRad = (skill.angle - 90) * (Math.PI / 180);
            const x = centerX + radius * Math.cos(angleRad);
            const y = centerY + radius * Math.sin(angleRad);
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="4"
                fill={accentColor}
                stroke="white"
                strokeWidth="2"
              />
            );
          })}
          
          {/* Labels */}
          {skills.map((skill, i) => {
            const labelRadius = maxRadius + 15;
            const angleRad = (skill.angle - 90) * (Math.PI / 180);
            const x = centerX + labelRadius * Math.cos(angleRad);
            const y = centerY + labelRadius * Math.sin(angleRad);
            return (
              <text
                key={i}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs font-bold"
                fill="rgba(255, 255, 255, 0.6)"
              >
                {skill.name}
              </text>
            );
          })}
        </svg>
      </div>
      
      {/* Skill Ratings */}
      <div className="space-y-2 mb-4">
        {skills.map((skill, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="text-white/60">{skill.name}</span>
            <div className="flex items-center gap-2">
              <div
                className="w-24 h-1.5 rounded-full overflow-hidden"
                style={{ background: 'rgba(255, 255, 255, 0.1)' }}
              >
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${skill.value}%`,
                    background: accentColor,
                  }}
                />
              </div>
              <span className="text-white/80 font-bold w-8 text-right">{skill.value}</span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Strengths */}
      {strengths.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-bold text-white/60 mb-2">💪 Strengths</div>
          <div className="flex flex-wrap gap-2">
            {strengths.map((strength, i) => (
              <div
                key={i}
                className="px-2 py-1 rounded-lg text-xs"
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                {strength}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Weaknesses */}
      {weaknesses.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-bold text-white/60 mb-2">⚠️ Areas to Improve</div>
          <div className="flex flex-wrap gap-2">
            {weaknesses.map((weakness, i) => (
              <div
                key={i}
                className="px-2 py-1 rounded-lg text-xs"
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                }}
              >
                {weakness}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <div className="text-xs font-bold text-white/60 mb-2">💡 Recommendations</div>
          <div className="space-y-1.5">
            {recommendations.slice(0, 3).map((rec, i) => (
              <div
                key={i}
                className="text-xs text-white/70 pl-3 border-l-2"
                style={{ borderColor: accentColor }}
              >
                {rec}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
