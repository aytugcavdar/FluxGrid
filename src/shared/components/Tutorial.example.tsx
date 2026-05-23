/**
 * Tutorial Component - Usage Examples
 * 
 * This file demonstrates various ways to use the Tutorial component.
 */

import React, { useState } from 'react';
import { Tutorial, TutorialAPI, useTutorialStore } from './Tutorial';

// ============================================================================
// Example 1: Basic Usage
// ============================================================================

export function BasicTutorialExample() {
  return (
    <div>
      <h1>My Game App</h1>
      {/* Tutorial will automatically show on first launch */}
      <Tutorial />
    </div>
  );
}

// ============================================================================
// Example 2: With Callbacks
// ============================================================================

export function TutorialWithCallbacksExample() {
  const [message, setMessage] = useState('');
  
  return (
    <div>
      <h1>My Game App</h1>
      <p>{message}</p>
      
      <Tutorial
        onComplete={() => {
          setMessage('Tutorial completed! 🎉');
          // Track analytics
          console.log('Tutorial completed');
        }}
        onSkip={() => {
          setMessage('Tutorial skipped');
          // Track analytics
          console.log('Tutorial skipped');
        }}
      />
    </div>
  );
}

// ============================================================================
// Example 3: Custom Configuration
// ============================================================================

export function CustomConfigExample() {
  return (
    <div>
      <h1>My Game App</h1>
      
      <Tutorial
        autoStart={true}        // Auto-start on first launch
        startDelay={1000}       // Wait 1 second for canvas to load
        onComplete={() => {
          console.log('Tutorial completed');
        }}
      />
    </div>
  );
}

// ============================================================================
// Example 4: Manual Control with TutorialAPI
// ============================================================================

export function ManualControlExample() {
  const [status, setStatus] = useState('');
  
  const handleStart = () => {
    TutorialAPI.start();
    setStatus('Tutorial started');
  };
  
  const handleSkip = () => {
    TutorialAPI.skip();
    setStatus('Tutorial skipped');
  };
  
  const handleReset = () => {
    TutorialAPI.reset();
    setStatus('Tutorial reset');
  };
  
  const checkStatus = () => {
    const state = TutorialAPI.getState();
    setStatus(`Active: ${state.isActive}, Step: ${state.currentStep}, Completed: ${state.isCompleted}`);
  };
  
  return (
    <div>
      <h1>Tutorial Controls</h1>
      <p>Status: {status}</p>
      
      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button onClick={handleStart}>Start Tutorial</button>
        <button onClick={handleSkip}>Skip Tutorial</button>
        <button onClick={handleReset}>Reset Tutorial</button>
        <button onClick={checkStatus}>Check Status</button>
      </div>
      
      <Tutorial autoStart={false} />
    </div>
  );
}

// ============================================================================
// Example 5: Settings Screen Integration
// ============================================================================

export function SettingsScreenExample() {
  const { reset, start, isCompleted } = useTutorialStore();
  
  const handleReplayTutorial = () => {
    reset();  // Clear completion status
    setTimeout(() => start(), 100);  // Start tutorial
  };
  
  return (
    <div>
      <h1>Settings</h1>
      
      <div style={{ marginTop: '20px' }}>
        <h2>Tutorial</h2>
        <p>Status: {isCompleted ? 'Completed' : 'Not completed'}</p>
        <button onClick={handleReplayTutorial}>
          🎓 Replay Tutorial
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Example 6: Conditional Tutorial Display
// ============================================================================

export function ConditionalTutorialExample() {
  const [gameStarted, setGameStarted] = useState(false);
  
  const handleStartGame = () => {
    setGameStarted(true);
    
    // Check if tutorial should be shown
    if (TutorialAPI.shouldShow()) {
      setTimeout(() => TutorialAPI.start(), 500);
    }
  };
  
  return (
    <div>
      {!gameStarted ? (
        <div>
          <h1>Welcome to FluxGrid</h1>
          <button onClick={handleStartGame}>Start Game</button>
        </div>
      ) : (
        <div>
          <h1>Game Screen</h1>
          {/* Tutorial will show if it's first launch */}
          <Tutorial />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Example 7: Analytics Integration
// ============================================================================

// Mock analytics service
const analyticsService = {
  logEvent: (event: string, params: any) => {
    console.log(`Analytics: ${event}`, params);
  },
};

export function AnalyticsIntegrationExample() {
  return (
    <div>
      <h1>My Game App</h1>
      
      <Tutorial
        onComplete={() => {
          analyticsService.logEvent('tutorial_complete', {
            timestamp: Date.now(),
            duration: 0, // Calculate actual duration
          });
        }}
        onSkip={() => {
          analyticsService.logEvent('tutorial_skip', {
            timestamp: Date.now(),
            step: TutorialAPI.getState().currentStep,
          });
        }}
      />
    </div>
  );
}

// ============================================================================
// Example 8: Multi-Step Tutorial with Custom Logic
// ============================================================================

export function CustomLogicExample() {
  const { isActive, currentStep } = useTutorialStore();
  
  // Show different UI based on tutorial state
  const getTutorialMessage = () => {
    if (!isActive) return null;
    
    switch (currentStep) {
      case 1:
        return 'Place your first piece!';
      case 2:
        return 'Great! Now clear a line!';
      case 3:
        return 'Build your combo by clearing lines!';
      case 4:
        return 'You\'re ready to play!';
      default:
        return null;
    }
  };
  
  return (
    <div>
      <h1>My Game App</h1>
      
      {isActive && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '8px',
          zIndex: 10001,
        }}>
          {getTutorialMessage()}
        </div>
      )}
      
      <Tutorial />
    </div>
  );
}

// ============================================================================
// Example 9: Testing Helper
// ============================================================================

export function TutorialTestingHelper() {
  const [log, setLog] = useState<string[]>([]);
  
  const addLog = (message: string) => {
    setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };
  
  const runTests = () => {
    addLog('Starting tests...');
    
    // Test 1: Reset
    TutorialAPI.reset();
    addLog(`Reset: shouldShow = ${TutorialAPI.shouldShow()}`);
    
    // Test 2: Start
    TutorialAPI.start();
    const state1 = TutorialAPI.getState();
    addLog(`Start: isActive = ${state1.isActive}, step = ${state1.currentStep}`);
    
    // Test 3: Skip
    TutorialAPI.skip();
    const state2 = TutorialAPI.getState();
    addLog(`Skip: isActive = ${state2.isActive}, completed = ${state2.isCompleted}`);
    
    // Test 4: Check shouldShow
    addLog(`After skip: shouldShow = ${TutorialAPI.shouldShow()}`);
    
    addLog('Tests completed!');
  };
  
  return (
    <div>
      <h1>Tutorial Testing Helper</h1>
      
      <button onClick={runTests}>Run Tests</button>
      <button onClick={() => setLog([])}>Clear Log</button>
      
      <div style={{
        marginTop: '20px',
        padding: '10px',
        background: '#f5f5f5',
        borderRadius: '4px',
        maxHeight: '300px',
        overflow: 'auto',
      }}>
        {log.map((entry, i) => (
          <div key={i} style={{ fontFamily: 'monospace', fontSize: '12px' }}>
            {entry}
          </div>
        ))}
      </div>
      
      <Tutorial autoStart={false} />
    </div>
  );
}

// ============================================================================
// Example 10: Complete App Integration
// ============================================================================

export function CompleteAppExample() {
  const [screen, setScreen] = useState<'home' | 'game' | 'settings'>('home');
  const { shouldShow, start, reset } = useTutorialStore();
  
  const handleStartGame = () => {
    setScreen('game');
    
    // Start tutorial on first launch
    if (shouldShow()) {
      setTimeout(() => start(), 500);
    }
  };
  
  const handleReplayTutorial = () => {
    reset();
    setScreen('game');
    setTimeout(() => start(), 500);
  };
  
  return (
    <div>
      {/* Navigation */}
      <nav style={{ padding: '10px', background: '#333', color: 'white' }}>
        <button onClick={() => setScreen('home')}>Home</button>
        <button onClick={() => setScreen('game')}>Game</button>
        <button onClick={() => setScreen('settings')}>Settings</button>
      </nav>
      
      {/* Content */}
      <div style={{ padding: '20px' }}>
        {screen === 'home' && (
          <div>
            <h1>Welcome to FluxGrid</h1>
            <button onClick={handleStartGame}>Start Game</button>
          </div>
        )}
        
        {screen === 'game' && (
          <div>
            <h1>Game Screen</h1>
            <p>Game content here...</p>
            <Tutorial />
          </div>
        )}
        
        {screen === 'settings' && (
          <div>
            <h1>Settings</h1>
            <button onClick={handleReplayTutorial}>
              🎓 Replay Tutorial
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
