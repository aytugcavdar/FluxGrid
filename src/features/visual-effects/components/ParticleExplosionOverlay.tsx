import React from 'react';
import { useVisualEffectStore } from '../store/visualEffectStore';
import { ParticleExplosion } from './ParticleExplosion';

export const ParticleExplosionOverlay: React.FC = React.memo(() => {
  const activeEffects = useVisualEffectStore(state => state.activeEffects);
  const removeEffect = useVisualEffectStore(state => state.removeEffect);
  
  // Filter only explosion effects
  const explosionEffects = activeEffects.filter(effect => effect.type === 'explosion');
  
  // Detect mobile
  const isMobile = window.innerWidth < 768;
  
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 999, // Below modals but above game content
      }}
    >
      {explosionEffects.map(effect => (
        <ParticleExplosion
          key={effect.id}
          x={effect.props.x}
          y={effect.props.y}
          color={effect.props.color}
          blockSize={effect.props.blockSize || 20}
          onComplete={() => removeEffect(effect.id)}
          isMobile={isMobile}
        />
      ))}
    </div>
  );
});
