/**
 * Performance Metrics Display Overlay
 * 
 * Shows real-time FPS, memory, render count, and frame time
 * Toggle with Ctrl+Shift+P
 * Only visible in development mode
 */

import React, { useEffect, useState } from 'react';
import { usePerformanceStore } from '../store/performanceStore';
import { motion, AnimatePresence } from 'framer-motion';

export const PerformanceMetricsDisplay: React.FC = () => {
  const { 
    fps, 
    memory, 
    frameTime, 
    warnings, 
    isOverlayVisible,
    toggleOverlay,
    exportMetrics,
  } = usePerformanceStore();

  // Toggle visibility with keyboard shortcut (Ctrl+Shift+P) or mobile gesture
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        toggleOverlay();
      }
    };
    
    // Mobile: Tap top-right corner 5 times quickly to toggle
    let tapCount = 0;
    let tapTimer: NodeJS.Timeout | null = null;
    
    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      const x = touch.clientX;
      const y = touch.clientY;
      
      // Check if tap is in top-right corner (within 100px from edges)
      const isTopRight = x > window.innerWidth - 100 && y < 100;
      
      if (isTopRight) {
        tapCount++;
        
        // Clear previous timer
        if (tapTimer) clearTimeout(tapTimer);
        
        // Check if 5 taps within 2 seconds
        if (tapCount >= 5) {
          e.preventDefault();
          
          // Enable in production if not already enabled
          if (process.env.NODE_ENV === 'production') {
            const wasEnabled = localStorage.getItem('enablePerformanceOverlay') === 'true';
            localStorage.setItem('enablePerformanceOverlay', 'true');
            
            if (!wasEnabled) {
              // Show reload message
              const reloadToast = document.createElement('div');
              reloadToast.textContent = 'Enabled! Reload page to see metrics';
              reloadToast.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.9);
                color: #10b981;
                padding: 12px 24px;
                border-radius: 8px;
                font-size: 14px;
                z-index: 99999;
                pointer-events: none;
              `;
              document.body.appendChild(reloadToast);
              setTimeout(() => {
                reloadToast.remove();
                // Auto reload after 2 seconds
                window.location.reload();
              }, 2000);
              return;
            }
          }
          
          toggleOverlay();
          tapCount = 0;
          
          // Show toast notification
          const toast = document.createElement('div');
          const message = isOverlayVisible 
            ? 'Performance overlay hidden' 
            : 'Performance overlay shown';
          toast.textContent = message;
          toast.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 99999;
            pointer-events: none;
          `;
          document.body.appendChild(toast);
          setTimeout(() => toast.remove(), 2000);
        } else {
          // Reset counter after 2 seconds
          tapTimer = setTimeout(() => {
            tapCount = 0;
          }, 2000);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('touchend', handleTouchEnd);
      if (tapTimer) clearTimeout(tapTimer);
    };
  }, [toggleOverlay, isOverlayVisible]);

  // Export metrics handler
  const handleExport = () => {
    const metrics = exportMetrics();
    const dataStr = JSON.stringify(metrics, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `performance-metrics-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  // Always allow - monitoring is always running now
  const isEnabled = true;
  
  // Debug log for troubleshooting
  useEffect(() => {
    if (!isEnabled) {
      console.log('[PerformanceMetrics] Disabled. To enable in production, run: localStorage.setItem("enablePerformanceOverlay", "true")');
    }
  }, [isEnabled]);
  
  if (!isEnabled) return null;
  
  if (!isOverlayVisible) return null;

  // Color coding for metrics
  const getFPSColor = (fps: number) => {
    if (fps >= 55) return '#10b981'; // green
    if (fps >= 45) return '#f59e0b'; // orange
    return '#ef4444'; // red
  };

  const getMemoryColor = (memory: number) => {
    const memoryMB = memory / 1024 / 1024;
    if (memoryMB < 100) return '#10b981'; // green
    if (memoryMB < 150) return '#f59e0b'; // orange
    return '#ef4444'; // red
  };

  const getFrameTimeColor = (frameTime: number) => {
    if (frameTime < 16) return '#10b981'; // green
    if (frameTime < 20) return '#f59e0b'; // orange
    return '#ef4444'; // red
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="fixed top-4 right-4 bg-black/90 text-white p-4 rounded-lg z-[9999] backdrop-blur-sm"
        style={{
          minWidth: '220px',
          fontFamily: 'monospace',
          fontSize: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/20">
          <h3 className="font-bold text-sm">Performance Metrics</h3>
          <button
            onClick={toggleOverlay}
            className="text-white/60 hover:text-white transition-colors"
            title="Close (Ctrl+Shift+P)"
          >
            ✕
          </button>
        </div>

        {/* Metrics */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-white/70">FPS:</span>
            <span 
              className="font-bold"
              style={{ color: getFPSColor(fps) }}
            >
              {fps.toFixed(1)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-white/70">Memory:</span>
            <span 
              className="font-bold"
              style={{ color: getMemoryColor(memory) }}
            >
              {(memory / 1024 / 1024).toFixed(1)} MB
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-white/70">Frame Time:</span>
            <span 
              className="font-bold"
              style={{ color: getFrameTimeColor(frameTime) }}
            >
              {frameTime.toFixed(2)} ms
            </span>
          </div>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/20">
            <h4 className="font-bold text-xs mb-2 text-yellow-400">
              ⚠ Warnings ({warnings.length})
            </h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {warnings.slice(-3).map((warning, i) => (
                <div 
                  key={i} 
                  className="text-xs text-yellow-400/90 leading-tight"
                  title={new Date(warning.timestamp).toLocaleTimeString()}
                >
                  {warning.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Export Button */}
        <button
          onClick={handleExport}
          className="mt-3 w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-500 rounded text-xs font-semibold transition-colors"
        >
          Export Metrics (JSON)
        </button>

        {/* Keyboard/Touch Hint */}
        <div className="mt-2 text-[10px] text-white/40 text-center">
          Desktop: Ctrl+Shift+P | Mobile: Tap top-right corner 5x
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
