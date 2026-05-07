import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useThemeStore } from '../store/themeStore';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { TrendingUp } from 'lucide-react';

export interface TrendDataPoint {
  timestamp: number;
  score: number;
  combo: number;
  tier?: number;
  gamesPlayed: number;
}

export interface ChartLine {
  dataKey: string;
  color: string;
  label: string;
  strokeWidth?: number;
}

export interface TrendAnalysisChartProps {
  data: TrendDataPoint[];
  lines: ChartLine[];
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
}

export const TrendAnalysisChart: React.FC<TrendAnalysisChartProps> = ({
  data,
  lines,
  height = 240,
  showGrid = true,
}) => {
  const { getThemeColors, currentTheme } = useThemeStore();
  const colors = getThemeColors();
  
  // Empty state
  if (!data || data.length === 0) {
    return (
      <div
        style={{
          height: height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%)',
            border: '1px solid rgba(168, 85, 247, 0.2)',
          }}>
            <TrendingUp className="w-6 h-6" style={{ color: '#a855f7' }} />
          </div>
          <p
            className="text-xs font-bold mb-0.5"
            style={{ color: 'rgba(196,181,253,0.7)' }}
          >
            Henüz yeterli veri yok
          </p>
          <p
            className="text-[10px]"
            style={{ color: 'rgba(196,181,253,0.35)' }}
          >
            Daha fazla oyun oyna ve trendini gör!
          </p>
        </div>
      </div>
    );
  }
  
  // Format data for chart - filter out invalid data
  const chartData = data
    .filter(point => point && point.timestamp)
    .map(point => ({
      ...point,
      date: format(point.timestamp, 'dd MMM', { locale: tr }),
      fullDate: format(point.timestamp, 'dd MMMM', { locale: tr }),
    }));
  
  // If no valid data after filtering, show empty state
  if (chartData.length === 0) {
    return (
      <div
        style={{
          height: height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%)',
            border: '1px solid rgba(168, 85, 247, 0.2)',
          }}>
            <TrendingUp className="w-6 h-6" style={{ color: '#a855f7' }} />
          </div>
          <p
            className="text-xs font-bold mb-0.5"
            style={{ color: 'rgba(196,181,253,0.7)' }}
          >
            Henüz yeterli veri yok
          </p>
          <p
            className="text-[10px]"
            style={{ color: 'rgba(196,181,253,0.35)' }}
          >
            Daha fazla oyun oyna ve trendini gör!
          </p>
        </div>
      </div>
    );
  }
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    
    const data = payload[0].payload;
    
    return (
      <div
        className="rounded-xl p-3 shadow-2xl backdrop-blur-xl"
        style={{
          background: currentTheme === 'light' 
            ? 'rgba(255,255,255,0.98)' 
            : 'rgba(15, 12, 29, 0.98)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        <p
          className="text-xs font-bold mb-2 pb-2"
          style={{ 
            color: colors.textPrimary,
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          {data.fullDate}
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#a855f7' }} />
              <span className="text-xs font-semibold" style={{ color: colors.textSecondary }}>Skor</span>
            </div>
            <span className="text-sm font-bold" style={{ color: '#a855f7' }}>
              {data.score?.toLocaleString('tr-TR') || 0}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#f59e0b' }} />
              <span className="text-xs font-semibold" style={{ color: colors.textSecondary }}>Kombo</span>
            </div>
            <span className="text-sm font-bold" style={{ color: '#f59e0b' }}>
              {data.combo?.toLocaleString('tr-TR') || 0}
            </span>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div style={{ padding: '4px 0' }}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 10, right: 16, left: -10, bottom: 5 }}>
          <defs>
            {/* Score gradient */}
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
            </linearGradient>
            {/* Combo gradient */}
            <linearGradient id="comboGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
            </linearGradient>
            {/* Glow filter */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255, 255, 255, 0.05)"
              vertical={false}
            />
          )}
          
          <XAxis
            dataKey="date"
            stroke="rgba(255, 255, 255, 0.2)"
            style={{ fontSize: '11px', fontWeight: 600 }}
            tick={{ fill: colors.textSecondary }}
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
            tickLine={false}
          />
          
          <YAxis
            stroke="rgba(255, 255, 255, 0.2)"
            style={{ fontSize: '11px', fontWeight: 600 }}
            tick={{ fill: colors.textSecondary }}
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
            tickLine={false}
          />
          
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(168, 85, 247, 0.3)', strokeWidth: 1 }} />
          
          {/* Score Area */}
          <Area
            type="monotone"
            dataKey="score"
            stroke="none"
            fill="url(#scoreGradient)"
          />
          
          {/* Combo Area */}
          <Area
            type="monotone"
            dataKey="combo"
            stroke="none"
            fill="url(#comboGradient)"
          />
          
          {/* Score Line */}
          <Line
            type="monotone"
            dataKey="score"
            stroke="#a855f7"
            strokeWidth={3}
            filter="url(#glow)"
            dot={{ 
              fill: '#a855f7', 
              r: 5,
              strokeWidth: 2,
              stroke: currentTheme === 'light' ? '#fff' : '#0f0c1d',
            }}
            activeDot={{ 
              r: 7,
              strokeWidth: 3,
              stroke: currentTheme === 'light' ? '#fff' : '#0f0c1d',
              fill: '#a855f7',
              filter: 'drop-shadow(0 0 8px #a855f7)',
            }}
          />
          
          {/* Combo Line */}
          <Line
            type="monotone"
            dataKey="combo"
            stroke="#f59e0b"
            strokeWidth={3}
            filter="url(#glow)"
            dot={{ 
              fill: '#f59e0b', 
              r: 5,
              strokeWidth: 2,
              stroke: currentTheme === 'light' ? '#fff' : '#0f0c1d',
            }}
            activeDot={{ 
              r: 7,
              strokeWidth: 3,
              stroke: currentTheme === 'light' ? '#fff' : '#0f0c1d',
              fill: '#f59e0b',
              filter: 'drop-shadow(0 0 8px #f59e0b)',
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: '#a855f7', boxShadow: '0 0 8px rgba(168, 85, 247, 0.5)' }} />
          <span className="text-xs font-bold" style={{ color: colors.textSecondary }}>SKOR</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: '#f59e0b', boxShadow: '0 0 8px rgba(245, 158, 11, 0.5)' }} />
          <span className="text-xs font-bold" style={{ color: colors.textSecondary }}>KOMBO</span>
        </div>
      </div>
    </div>
  );
};
