import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  initializePerformanceMonitoring,
  startGameLoadMeasure,
  measureGameLoad,
  startLevelStartMeasure,
  measureLevelStart,
  startScoreSubmissionMeasure,
  measureScoreSubmission,
} from './performanceMonitoring';

// Mock Firebase Performance
vi.mock('../firebase/firebaseConfig', () => ({
  getFirebasePerformance: vi.fn(() => null), // Return null to skip Firebase Performance in tests
}));

// Mock Sentry
vi.mock('@sentry/react', () => ({
  setMeasurement: vi.fn(),
  setTag: vi.fn(),
  captureMessage: vi.fn(),
}));

// Mock Capacitor
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: vi.fn(() => 'web'),
  },
}));

describe('Performance Monitoring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear performance marks and measures
    performance.clearMarks();
    performance.clearMeasures();
    // Clear global trace variables
    delete (window as any).__gameLoadTrace;
    delete (window as any).__levelStartTraces;
    delete (window as any).__scoreSubmissionTrace;
  });

  describe('initializePerformanceMonitoring', () => {
    it('should initialize without errors', () => {
      expect(() => initializePerformanceMonitoring()).not.toThrow();
    });
  });

  describe('Game Load Measurement', () => {
    it('should start game load measurement', () => {
      startGameLoadMeasure();
      const marks = performance.getEntriesByName('game-load-start');
      expect(marks.length).toBe(1);
    });

    it('should measure game load time', () => {
      startGameLoadMeasure();
      // Simulate some work
      const start = Date.now();
      while (Date.now() - start < 10) {
        // Wait 10ms
      }
      measureGameLoad();
      
      const measures = performance.getEntriesByName('game-load-time');
      expect(measures.length).toBe(0); // Cleared after measurement
    });

    it('should handle missing start mark gracefully', () => {
      // Don't call startGameLoadMeasure
      expect(() => measureGameLoad()).not.toThrow();
    });
  });

  describe('Level Start Measurement', () => {
    it('should start level start measurement', () => {
      startLevelStartMeasure(1);
      const marks = performance.getEntriesByName('level-1-start');
      expect(marks.length).toBe(1);
    });

    it('should measure level start time', () => {
      startLevelStartMeasure(1);
      // Simulate some work
      const start = Date.now();
      while (Date.now() - start < 10) {
        // Wait 10ms
      }
      measureLevelStart(1);
      
      const measures = performance.getEntriesByName('level-1-start-time');
      expect(measures.length).toBe(0); // Cleared after measurement
    });

    it('should handle multiple levels', () => {
      startLevelStartMeasure(1);
      startLevelStartMeasure(2);
      
      const marks1 = performance.getEntriesByName('level-1-start');
      const marks2 = performance.getEntriesByName('level-2-start');
      
      expect(marks1.length).toBe(1);
      expect(marks2.length).toBe(1);
    });
  });

  describe('Score Submission Measurement', () => {
    it('should start score submission measurement', () => {
      startScoreSubmissionMeasure();
      const marks = performance.getEntriesByName('score-submission-start');
      expect(marks.length).toBe(1);
    });

    it('should measure score submission time with success', () => {
      startScoreSubmissionMeasure();
      // Simulate some work
      const start = Date.now();
      while (Date.now() - start < 10) {
        // Wait 10ms
      }
      measureScoreSubmission(true);
      
      const measures = performance.getEntriesByName('score-submission-time');
      expect(measures.length).toBe(0); // Cleared after measurement
    });

    it('should measure score submission time with failure', () => {
      startScoreSubmissionMeasure();
      measureScoreSubmission(false);
      
      const measures = performance.getEntriesByName('score-submission-time');
      expect(measures.length).toBe(0); // Cleared after measurement
    });
  });
});
