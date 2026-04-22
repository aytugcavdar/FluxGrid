/**
 * Particle Disposal Utility
 * 
 * Handles proper disposal of particle systems and their resources
 */

/**
 * Dispose a particle system and its resources
 */
export function disposeParticleSystem(particleSystem: any): void {
  if (!particleSystem) return;
  
  try {
    // Stop the particle system
    if (particleSystem.stop) {
      particleSystem.stop();
    }
    
    // Dispose textures
    if (particleSystem.particleTexture) {
      particleSystem.particleTexture.dispose();
    }
    
    // Dispose materials
    if (particleSystem.material) {
      particleSystem.material.dispose();
    }
    
    // Dispose the particle system itself
    if (particleSystem.dispose) {
      particleSystem.dispose();
    }
    
    console.log('[ParticleDisposal] Particle system disposed');
  } catch (error) {
    console.error('[ParticleDisposal] Error disposing particle system:', error);
  }
}

/**
 * Dispose multiple particle systems
 */
export function disposeParticleSystems(particleSystems: any[]): void {
  for (const system of particleSystems) {
    disposeParticleSystem(system);
  }
}

/**
 * Set up particle disposal listener
 */
export function setupParticleDisposalListener(): void {
  window.addEventListener('dispose-effect', (event: any) => {
    const { effectId } = event.detail;
    
    // Find particle system by effect ID
    const particleSystem = (window as any).__particleSystems?.[effectId];
    
    if (particleSystem) {
      disposeParticleSystem(particleSystem);
      
      // Remove from registry
      delete (window as any).__particleSystems[effectId];
    }
  });
  
  console.log('[ParticleDisposal] Disposal listener set up');
}
