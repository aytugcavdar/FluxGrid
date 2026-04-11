import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
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
  height = 220,
  showGrid = true,
  showLegend = true,
}) => {
  const { getThemeColors, currentTheme } = useThemeStore();
  const colors = getThemeColors();
  
  // Empty state
  if (!data || data.length === 0) {
    return (
      <div
        className="rounded-2xl p-8 text-center backdrop-blur-xl"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          height: height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div>
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{
            background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(249, 115, 22, 0.1) 100%)',
          }}>
            <TrendingUp className="w-8 h-8" style={{ color: colors.textSecondary }} />
          </div>
          <p
            className="text-sm font-semibold mb-1"
            style={{ color: colors.textPrimary }}
          >
            Henüz yeterli veri yok
          </p>
          <p
            className="text-xs"
            style={{ color: colors.textSecondary }}
          >
            Daha fazla oyun oyna ve trendini gör!
          </p>
        </div>
      </div>
    );
  }
  
  // Format data for chart
  const chartData = data.map(point => ({
    ...point,
    date: format(point.timestamp, 'dd MMM', { locale: tr }),
  }));
  
  // Custom tooltip with glassmorphism
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    
    const data = payload[0].payload;
    
    return (
      <div
        className="rounded-xl p-4 shadow-2xl backdrop-blur-xl"
        style={{
          background: currentTheme === 'light' 
            ? 'rgba(255,255,255,0.95)' 
            : 'rgba(15, 12, 29, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
      >
        <p
          className="text-xs font-bold mb-3 pb-2"
          style={{ 
            color: colors.textPrimary,
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {format(data.timestamp, 'dd MMMM yyyy', { locale: tr })}
        </p>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ background: entry.color }}
                />
                <span className="text-xs" style={{ color: colors.textSecondary }}>
                  {entry.name}
                </span>
              </div>
              <span
                className="text-sm font-bold"
                style={{ color: entry.color }}
              >
                {entry.value.toLocaleString('tr-TR')}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between gap-4 pt-2 mt-2" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <span className="text-xs" style={{ color: colors.textSecondary }}>
              Oyun Sayısı
            </span>
            <span
              className="text-sm font-bold"
              style={{ color: colors.textPrimary }}
            >
              {data.gamesPlayed}
            </span>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div
      className="rounded-2xl p-5 backdrop-blur-xl"
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      }}
    >
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
          <defs>
            {lines.map((line, index) => (
              <linearGradient key={index} id={`gradient-${line.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={line.color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={line.color} stopOpacity={0}/>
              </linearGradient>
            ))}
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
            stroke="rgba(255, 255, 255, 0.3)"
            style={{ fontSize: '11px', fontWeight: 500 }}
            tick={{ fill: colors.textSecondary }}
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
            tickLine={false}
          />
          <YAxis
            stroke="rgba(255, 255, 255, 0.3)"
            style={{ fontSize: '11px', fontWeight: 500 }}
            tick={{ fill: colors.textSecondary }}
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255, 255, 255, 0.1)', strokeWidth: 2 }} />
          {showLegend && (
            <Legend
              wrapperStyle={{
                fontSize: '12px',
                fontWeight: 600,
                paddingTop: '10px',
              }}
              iconType="circle"
              iconSize={8}
            />
          )}
          {lines.map((line, index) => (
            <React.Fragment key={index}>
              <Area
                type="monotone"
                dataKey={line.dataKey}
                stroke="none"
                fill={`url(#gradient-${line.dataKey})`}
              />
              <Line
                type="monotone"
                dataKey={line.dataKey}
                name={line.label}
                stroke={line.color}
                strokeWidth={line.strokeWidth || 3}
                dot={{ 
                  fill: line.color, 
                  r: 4,
                  strokeWidth: 2,
                  stroke: currentTheme === 'light' ? '#fff' : '#0f0c1d',
                }}
                activeDot={{ 
                  r: 6,
                  strokeWidth: 3,
                  stroke: currentTheme === 'light' ? '#fff' : '#0f0c1d',
                  fill: line.color,
                }}
              />
            </React.Fragment>
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
