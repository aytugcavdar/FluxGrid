import React from 'react';
import { useThemeStore } from '../store/themeStore';

export interface SectionHeaderProps {
  title: string;
  dividerColor?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, dividerColor }) => {
  const colors = useThemeStore((state) => state.getThemeColors());

  return (
    <div className="flex items-center gap-3 mb-4">
      <h2
        className="text-xs uppercase tracking-wider whitespace-nowrap"
        style={{ color: colors.textTertiary }}
      >
        {title}
      </h2>
      <div
        className="flex-1 h-[0.5px]"
        style={{
          backgroundColor: dividerColor || 'rgba(255,255,255,0.05)',
        }}
      />
    </div>
  );
};
