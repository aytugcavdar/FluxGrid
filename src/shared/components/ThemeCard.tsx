import { ThemeCardProps } from '../types/ui';

export const ThemeCard: React.FC<ThemeCardProps> = ({
  label,
  colors,
  isSelected,
  onSelect,
}) => {
  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      aria-label={`${label} temasını seç`}
      aria-pressed={isSelected}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className="cursor-pointer rounded-2xl p-5 transition-all"
      style={{
        background: isSelected 
          ? 'rgba(59,130,246,0.1)' 
          : 'rgba(255,255,255,0.03)',
        border: isSelected 
          ? '2px solid #3b82f6' 
          : '2px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        {colors.map((color, index) => (
          <div
            key={index}
            className="w-5 h-5 rounded-full"
            style={{ background: color }}
          />
        ))}
      </div>
      
      <p className="text-sm font-semibold text-white">{label}</p>
    </div>
  );
};
