import React from 'react';
import { useTranslation } from 'react-i18next';

interface ScoreDistributionChartProps {
  data: { range: string; count: number; color: string }[];
  height?: number;
}

export const ScoreDistributionChart: React.FC<ScoreDistributionChartProps> = ({
  data,
  height = 200,
}) => {
  const { t } = useTranslation();
  
  const maxCount = Math.max(...data.map(d => d.count), 1);
  
  return (
    <div
      className="rounded-2xl p-5 backdrop-blur-xl"
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white/80">
          📊 {t('stats.scoreDistribution', 'Skor Dağılımı')}
        </h3>
        <span className="text-xs text-white/40">
          {data.reduce((sum, d) => sum + d.count, 0)} {t('stats.games', 'oyun')}
        </span>
      </div>
      
      <div className="flex items-end justify-between gap-2" style={{ height }}>
        {data.map((item, index) => {
          const barHeight = (item.count / maxCount) * 100;
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              {/* Bar */}
              <div className="w-full flex flex-col justify-end" style={{ height: height - 40 }}>
                <div
                  className="w-full rounded-t-lg transition-all duration-500 relative group"
                  style={{
                    height: `${barHeight}%`,
                    background: `linear-gradient(180deg, ${item.color} 0%, ${item.color}80 100%)`,
                    boxShadow: `0 0 20px ${item.color}40`,
                  }}
                >
                  {/* Count label */}
                  {item.count > 0 && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs font-bold text-white bg-black/60 px-2 py-1 rounded">
                        {item.count}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Label */}
              <span className="text-[10px] text-white/50 text-center leading-tight">
                {item.range}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
