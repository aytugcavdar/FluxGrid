/**
 * Time Heatmap Card - GitHub-style activity heatmap
 */

import React from 'react';
import { TimeAnalytics } from '../types/analytics';

interface TimeHeatmapCardProps {
  timeAnalytics: TimeAnalytics;
}

export const TimeHeatmapCard: React.FC<TimeHeatmapCardProps> = ({ timeAnalytics }) => {
  const { dailyHeatmap, peakPerformanceTime, playFrequency } = timeAnalytics;
  
  // Get color intensity based on game count
  const getHeatmapColor = (count: number): string => {
    if (count === 0) return 'rgba(255, 255, 255, 0.05)';
    if (count <= 2) return 'rgba(168, 85, 247, 0.3)';
    if (count <= 5) return 'rgba(168, 85, 247, 0.5)';
    if (count <= 10) return 'rgba(168, 85, 247, 0.7)';
    return 'rgba(168, 85, 247, 0.9)';
  };
  
  // Group heatmap by weeks (each week is an array of days)
  const weeks: Array<Array<{ date: string; count: number; score: number }>> = [];
  for (let i = 0; i < dailyHeatmap.length; i += 7) {
    weeks.push(dailyHeatmap.slice(i, i + 7));
  }
  
  // Day names
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Play frequency data
  const frequencyData = [
    { day: 'Mon', count: playFrequency.monday },
    { day: 'Tue', count: playFrequency.tuesday },
    { day: 'Wed', count: playFrequency.wednesday },
    { day: 'Thu', count: playFrequency.thursday },
    { day: 'Fri', count: playFrequency.friday },
    { day: 'Sat', count: playFrequency.saturday },
    { day: 'Sun', count: playFrequency.sunday },
  ];
  
  const maxFrequency = Math.max(...frequencyData.map(d => d.count), 1);
  
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
        <h3 className="text-lg font-bold text-white">📅 Activity Heatmap</h3>
        <div className="text-xs text-white/60">
          Last 90 days
        </div>
      </div>
      
      {/* Peak Performance Time */}
      <div
        className="mb-4 p-3 rounded-xl"
        style={{
          background: 'rgba(168, 85, 247, 0.1)',
          border: '1px solid rgba(168, 85, 247, 0.2)',
        }}
      >
        <div className="text-xs text-white/60 mb-1">🔥 Peak Performance</div>
        <div className="text-lg font-bold text-purple-400">{peakPerformanceTime}</div>
      </div>
      
      {/* Heatmap Grid */}
      <div className="mb-4 overflow-x-auto">
        <div className="inline-flex gap-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  className="w-3 h-3 rounded-sm cursor-pointer transition-all hover:scale-110"
                  style={{
                    background: getHeatmapColor(day.count),
                  }}
                  title={`${day.date}: ${day.count} games, ${day.score} points`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-between mb-4 text-xs text-white/60">
        <span>Less</span>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map(level => (
            <div
              key={level}
              className="w-3 h-3 rounded-sm"
              style={{
                background: getHeatmapColor(level * 3),
              }}
            />
          ))}
        </div>
        <span>More</span>
      </div>
      
      {/* Weekly Frequency */}
      <div>
        <div className="text-xs font-bold text-white/60 mb-3">📊 Weekly Pattern</div>
        <div className="space-y-2">
          {frequencyData.map((data, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-white/60 w-8">{data.day}</span>
              <div className="flex-1 h-6 rounded-lg overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${(data.count / maxFrequency) * 100}%`,
                    background: 'linear-gradient(90deg, #a855f7, #c084fc)',
                  }}
                />
              </div>
              <span className="text-xs text-white/80 font-bold w-8 text-right">{data.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
