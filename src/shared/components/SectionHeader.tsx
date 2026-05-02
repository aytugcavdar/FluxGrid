import React from 'react';
import { motion } from 'framer-motion';
import { useThemeStore } from '../store/themeStore';

export interface SectionHeaderProps {
  title: string;
  dividerColor?: string;
  icon?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, dividerColor, icon }) => {
  const colors = useThemeStore((state) => state.getThemeColors());

  return (
    <div className="flex items-center gap-3 mb-4">
      {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
      <h2
        className="text-[10px] uppercase tracking-[0.15em] font-bold whitespace-nowrap"
        style={{
          color: 'rgba(160,160,200,0.7)',
          letterSpacing: '0.15em',
        }}
      >
        {title}
      </h2>
      {/* Animated gradient divider */}
      <div className="flex-1 h-px overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 1 }}>
        <motion.div
          initial={{ scaleX: 0, originX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.1 }}
          style={{
            height: '100%',
            background: dividerColor
              ? `linear-gradient(90deg, ${dividerColor}, transparent)`
              : 'linear-gradient(90deg, rgba(99,102,241,0.5), rgba(168,85,247,0.3), transparent)',
            transformOrigin: 'left',
          }}
        />
      </div>
    </div>
  );
};

