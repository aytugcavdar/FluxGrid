/**
 * Device Detection System
 * 
 * Analyzes hardware capabilities to classify devices into performance tiers
 */

import type { DeviceCapabilities, GPUInfo, ScreenInfo } from '../types';

export class DeviceDetector {
  detect(): DeviceCapabilities {
    const ram = this.detectRAM();
    const cores = this.detectCPU();
    const gpu = this.detectGPU();
    const screen = this.detectScreen();
    const isMobile = this.detectMobile();
    
    const classification = this.classify({ ram, cores, gpu, screen, isMobile });
    
    return { classification, ram, cores, gpu, screen, isMobile };
  }
  
  private detectRAM(): number {
    // Use navigator.deviceMemory (Chrome/Edge only)
    if ('deviceMemory' in navigator) {
      return (navigator as any).deviceMemory;
    }
    
    // Fallback: estimate based on other factors
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    return isMobile ? 2 : 4; // Conservative estimate
  }
  
  private detectCPU(): number {
    // Use navigator.hardwareConcurrency for logical cores
    if ('hardwareConcurrency' in navigator) {
      return navigator.hardwareConcurrency || 4;
    }
    
    return 4; // Default fallback
  }
  
  private detectGPU(): GPUInfo {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl) {
        return { vendor: 'unknown', renderer: 'unknown', tier: 1 };
      }
      
      const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
      if (!debugInfo) {
        return { vendor: 'unknown', renderer: 'unknown', tier: 2 };
      }
      
      const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      
      // Estimate tier based on renderer string
      const tier = this.estimateGPUTier(renderer);
      
      return { vendor, renderer, tier };
    } catch (error) {
      console.error('[DeviceDetector] GPU detection failed:', error);
      return { vendor: 'unknown', renderer: 'unknown', tier: 2 };
    }
  }
  
  private estimateGPUTier(renderer: string): number {
    const lower = renderer.toLowerCase();
    
    // High-end indicators
    if (lower.includes('nvidia') && (lower.includes('rtx') || lower.includes('gtx 1'))) {
      return 3;
    }
    if (lower.includes('amd') && lower.includes('rx')) {
      return 3;
    }
    if (lower.includes('apple') && (lower.includes('m1') || lower.includes('m2') || lower.includes('m3'))) {
      return 3;
    }
    
    // Low-end indicators
    if (lower.includes('intel') && lower.includes('hd')) {
      return 1;
    }
    if (lower.includes('mali') || lower.includes('adreno 5')) {
      return 1;
    }
    if (lower.includes('powervr')) {
      return 1;
    }
    
    // Default to medium
    return 2;
  }
  
  private detectScreen(): ScreenInfo {
    return {
      width: window.screen.width,
      height: window.screen.height,
      pixelRatio: window.devicePixelRatio || 1,
      refreshRate: 60 // Default, actual detection not widely supported
    };
  }
  
  private detectMobile(): boolean {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
  
  private classify(caps: Partial<DeviceCapabilities>): 'low' | 'medium' | 'high' {
    const { ram = 2, gpu = { tier: 2 }, isMobile = false } = caps;
    
    // Low-end: 2GB RAM or less, OR low-tier GPU
    if (ram <= 2 || gpu.tier === 1) {
      return 'low';
    }
    
    // High-end: >4GB RAM AND high-tier GPU AND not mobile
    if (ram > 4 && gpu.tier === 3 && !isMobile) {
      return 'high';
    }
    
    // Everything else is medium
    return 'medium';
  }
}

// Singleton instance
export const deviceDetector = new DeviceDetector();
