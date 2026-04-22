import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useCleanup } from '@shared/hooks/useCleanup';

export interface ParticleExplosionProps {
  x: number;              // Grid coordinate (0-9)
  y: number;              // Grid coordinate (0-9)
  color: string;          // Block color (hex)
  blockSize: number;      // Block size (px)
  onComplete: () => void; // Animation complete callback
  isMobile?: boolean;     // Mobile device optimization
}

interface Particle {
  id: string;
  x: number;              // Start x position
  y: number;              // Start y position
  angle: number;          // Movement angle (0-360)
  velocity: number;       // Speed
  size: number;           // Particle size
  color: string;          // Particle color
}

const generateParticles = (
  color: string,
  blockSize: number,
  isMobile: boolean = false
): Particle[] => {
  const particleCount = isMobile ? 3 : 4; // Further reduced: Mobile: 3, Desktop: 4
  const particles: Particle[] = [];
  
  for (let i = 0; i < particleCount; i++) {
    const angle = (360 / particleCount) * i; // Fixed angles, no randomness for better performance
    const velocity = 20; // Fixed velocity for consistency
    const size = blockSize * 0.18; // Fixed size: 18% of block size
    
    particles.push({
      id: `particle-${i}`,
      x: 0,
      y: 0,
      angle,
      velocity,
      size,
      color,
    });
  }
  
  return particles;
};

export const ParticleExplosion: React.FC<ParticleExplosionProps> = React.memo(({
  x,
  y,
  color,
  blockSize,
  onComplete,
  isMobile = false,
}) => {
  const cleanup = useCleanup();
  
  const particles = useMemo(
    () => generateParticles(color, blockSize, isMobile),
    [color, blockSize, isMobile]
  );
  
  const duration = 0.18; // Fixed fast duration: 180ms
  
  useEffect(() => {
    const timer = cleanup.trackTimeout(() => {
      onComplete();
    }, duration * 1000);
  }, [duration, onComplete, cleanup]);
  
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      {particles.map((particle) => {
        const radians = (particle.angle * Math.PI) / 180;
        const endX = Math.cos(radians) * particle.velocity;
        const endY = Math.sin(radians) * particle.velocity;
        
        return (
          <motion.div
            key={particle.id}
            initial={{
              x: particle.x,
              y: particle.y,
              opacity: 1,
              scale: 1,
            }}
            animate={{
              x: endX,
              y: endY,
              opacity: 0,
              scale: 0.5,
            }}
            transition={{
              duration,
              ease: 'easeOut',
            }}
            style={{
              position: 'absolute',
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              borderRadius: '50%',
              willChange: 'transform, opacity',
            }}
          />
        );
      })}
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if props change
  return prevProps.x === nextProps.x && 
         prevProps.y === nextProps.y && 
         prevProps.color === nextProps.color && 
         prevProps.blockSize === nextProps.blockSize && 
         prevProps.isMobile === nextProps.isMobile;
});
