import React, { useState, useEffect } from 'react';

interface LogEntry {
  timestamp: number;
  level: 'log' | 'warn' | 'error';
  message: string;
}

const MAX_LOGS = 50;
let logs: LogEntry[] = [];
let listeners: Set<() => void> = new Set();

// Intercept console methods
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

function addLog(level: 'log' | 'warn' | 'error', args: any[]) {
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ');
  
  logs.push({
    timestamp: Date.now(),
    level,
    message
  });
  
  // Keep only last MAX_LOGS
  if (logs.length > MAX_LOGS) {
    logs = logs.slice(-MAX_LOGS);
  }
  
  // Notify listeners
  listeners.forEach(listener => listener());
}

console.log = (...args: any[]) => {
  originalLog(...args);
  const firstArg = String(args[0] || '');
  // Capture logs with specific prefixes or device/performance related logs
  if (
    firstArg.includes('[Grid]') || 
    firstArg.includes('[HomeScreen]') || 
    firstArg.includes('[Settings]') ||
    firstArg.includes('[DeviceCapability]') ||
    firstArg.includes('[FPS]') ||
    firstArg.includes('FPS:') ||
    firstArg.includes('Device tier:') ||
    firstArg.includes('Throttling') ||
    firstArg.includes('PERFORMANCE METRICS') ||
    firstArg.includes('Current FPS:') ||
    firstArg.includes('Average FPS:')
  ) {
    addLog('log', args);
  }
};

console.warn = (...args: any[]) => {
  originalWarn(...args);
  addLog('warn', args);
};

console.error = (...args: any[]) => {
  originalError(...args);
  addLog('error', args);
};

export const RemoteLogger: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [, forceUpdate] = useState(0);
  
  useEffect(() => {
    const listener = () => forceUpdate(prev => prev + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);
  
  // Toggle with 3-finger tap
  useEffect(() => {
    let touchCount = 0;
    let touchTimer: NodeJS.Timeout;
    
    const handleTouch = (e: TouchEvent) => {
      if (e.touches.length === 3) {
        touchCount++;
        clearTimeout(touchTimer);
        touchTimer = setTimeout(() => { touchCount = 0; }, 500);
        
        if (touchCount === 2) {
          setVisible(prev => !prev);
          touchCount = 0;
        }
      }
    };
    
    document.addEventListener('touchstart', handleTouch);
    return () => document.removeEventListener('touchstart', handleTouch);
  }, []);
  
  if (!visible) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.95)',
      color: '#00ff00',
      fontFamily: 'monospace',
      fontSize: '10px',
      padding: '10px',
      overflowY: 'auto',
      zIndex: 99999,
      pointerEvents: 'auto'
    }}>
      <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
        <strong>DEBUG CONSOLE (3-finger double-tap to toggle)</strong>
        <div style={{ display: 'flex', gap: '5px' }}>
          <button 
            onClick={async () => {
              const logsText = logs.map(log => 
                `[${new Date(log.timestamp).toLocaleTimeString()}] ${log.message}`
              ).join('\n');
              
              try {
                // Try to share or copy
                if (navigator.share) {
                  await navigator.share({
                    title: 'FluxGrid Debug Logs',
                    text: logsText
                  });
                } else {
                  await navigator.clipboard.writeText(logsText);
                  alert('Logs copied to clipboard!');
                }
              } catch (err) {
                console.error('Failed to export logs:', err);
                alert('Export failed. Logs are in console.');
              }
            }}
            style={{ background: '#00ff00', color: '#000', border: 'none', padding: '5px 10px', fontSize: '10px' }}
          >
            Export
          </button>
          <button 
            onClick={() => { logs = []; forceUpdate(prev => prev + 1); }}
            style={{ background: '#ff0000', color: '#fff', border: 'none', padding: '5px 10px', fontSize: '10px' }}
          >
            Clear
          </button>
        </div>
      </div>
      {logs.map((log, i) => (
        <div key={i} style={{ 
          marginBottom: '5px', 
          color: log.level === 'error' ? '#ff0000' : log.level === 'warn' ? '#ffff00' : '#00ff00',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all'
        }}>
          [{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
        </div>
      ))}
    </div>
  );
};

export function getLogs(): LogEntry[] {
  return [...logs];
}

export function exportLogs(): string {
  return JSON.stringify(logs, null, 2);
}
