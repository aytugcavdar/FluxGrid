import { onCLS, onLCP, onFCP, onTTFB, onINP, Metric } from 'web-vitals';
import * as Sentry from '@sentry/react';
import { Capacitor } from '@capacitor/core';
import { trace, PerformanceTrace } from 'firebase/performance';
import { getFirebasePerformance } from '../../../services/firebase/firebaseConfig';

/**
 * Initialize performance monitoring for Core Web Vitals
 * Tracks LCP, FID, CLS, FCP, TTFB, and INP metrics
 * 
 * Performance Sampling Configuration:
 * - Firebase Performance SDK automatically samples 10% of sessions by default
 * - Sampling reduces overhead and Firebase quota usage
 * - All custom traces and automatic network monitoring respect this sampling rate
 * - Sampling can be configured in Firebase Console under Performance Monitoring settings
 */
export function initializePerformanceMonitoring(): void {
  const platform = Capacitor.getPlatform();
  const appVersion = import.meta.env.VITE_APP_VERSION || '1.0.0';

  // Initialize Firebase Performance
  // Note: Firebase Performance SDK automatically samples 10% of sessions
  // This sampling applies to all custom traces and automatic network monitoring
  const perf = getFirebasePerformance();
  if (perf) {
    console.log('[Performance] Firebase Performance initialized with automatic sampling (10% of sessions)');
  }

  // Track Core Web Vitals
  // These metrics are sent to Sentry with 10% sampling (configured in Sentry initialization)
  onCLS((metric) => sendMetricToAnalytics(metric, platform, appVersion));
  onLCP((metric) => sendMetricToAnalytics(metric, platform, appVersion));
  onFCP((metric) => sendMetricToAnalytics(metric, platform, appVersion));
  onTTFB((metric) => sendMetricToAnalytics(metric, platform, appVersion));
  onINP((metric) => sendMetricToAnalytics(metric, platform, appVersion));

  console.log('[Performance] Monitoring initialized with platform:', platform, 'version:', appVersion);
}

/**
 * Send metric to analytics services (Sentry)
 */
function sendMetricToAnalytics(metric: Metric, platform: string, appVersion: string): void {
  // Log to console in development
  if (import.meta.env.MODE === 'development') {
    console.log(`[Performance] ${metric.name}:`, {
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
    });
  }

  // Send to Sentry as measurement
  Sentry.setMeasurement(metric.name, metric.value, 'millisecond');

  // Add tags for filtering
  Sentry.setTag('metric_name', metric.name);
  Sentry.setTag('metric_rating', metric.rating);
  Sentry.setTag('platform', platform);
  Sentry.setTag('app_version', appVersion);

  // Log performance issue if metric is poor
  if (metric.rating === 'poor') {
    Sentry.captureMessage(`Poor ${metric.name} performance detected`, {
      level: 'warning',
      contexts: {
        performance: {
          metric: metric.name,
          value: metric.value,
          rating: metric.rating,
          threshold: getThreshold(metric.name),
        },
      },
    });
  }
}

/**
 * Get performance threshold for a metric
 */
function getThreshold(metricName: string): string {
  const thresholds: Record<string, string> = {
    CLS: '0.1',
    LCP: '2.5s',
    FCP: '1.8s',
    TTFB: '800ms',
    INP: '200ms',
  };
  return thresholds[metricName] || 'unknown';
}

/**
 * Measure game load time
 * Call this when the game finishes loading
 */
export function measureGameLoad(): void {
  const startMark = 'game-load-start';
  const endMark = 'game-load-end';
  const measureName = 'game-load-time';

  try {
    // Check if start mark exists
    const marks = performance.getEntriesByName(startMark);
    if (marks.length === 0) {
      console.warn('[Performance] game-load-start mark not found');
      return;
    }

    // Mark end
    performance.mark(endMark);

    // Measure duration
    performance.measure(measureName, startMark, endMark);
    const measure = performance.getEntriesByName(measureName)[0];

    // Send to Sentry
    Sentry.setMeasurement('game_load_time', measure.duration, 'millisecond');

    // Stop Firebase Performance trace
    const gameLoadTrace = (window as any).__gameLoadTrace;
    if (gameLoadTrace) {
      gameLoadTrace.putMetric('duration_ms', measure.duration);
      gameLoadTrace.stop();
      delete (window as any).__gameLoadTrace;
    }

    console.log(`[Performance] Game load time: ${measure.duration.toFixed(2)}ms`);

    // Clean up marks
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(measureName);
  } catch (error) {
    console.error('[Performance] Error measuring game load:', error);
  }
}

/**
 * Start measuring game load time
 * Call this at the beginning of game initialization
 */
export function startGameLoadMeasure(): void {
  try {
    performance.mark('game-load-start');
    
    // Start Firebase Performance trace
    const perf = getFirebasePerformance();
    if (perf) {
      const gameLoadTrace = trace(perf, 'game_load');
      gameLoadTrace.start();
      // Store trace in a global variable so we can stop it later
      (window as any).__gameLoadTrace = gameLoadTrace;
    }
  } catch (error) {
    console.error('[Performance] Error starting game load measure:', error);
  }
}

/**
 * Measure level start time
 * Call this when a new level starts
 */
export function measureLevelStart(levelNumber: number): void {
  const startMark = `level-${levelNumber}-start`;
  const endMark = `level-${levelNumber}-end`;
  const measureName = `level-${levelNumber}-start-time`;

  try {
    // Check if start mark exists
    const marks = performance.getEntriesByName(startMark);
    if (marks.length === 0) {
      console.warn(`[Performance] ${startMark} mark not found`);
      return;
    }

    // Mark end
    performance.mark(endMark);

    // Measure duration
    performance.measure(measureName, startMark, endMark);
    const measure = performance.getEntriesByName(measureName)[0];

    // Send to Sentry
    Sentry.setMeasurement('level_start_time', measure.duration, 'millisecond');
    Sentry.setTag('level_number', levelNumber.toString());

    // Stop Firebase Performance trace
    const levelStartTraces = (window as any).__levelStartTraces;
    if (levelStartTraces && levelStartTraces[levelNumber]) {
      const levelStartTrace = levelStartTraces[levelNumber];
      levelStartTrace.putMetric('duration_ms', measure.duration);
      levelStartTrace.stop();
      delete levelStartTraces[levelNumber];
    }

    console.log(`[Performance] Level ${levelNumber} start time: ${measure.duration.toFixed(2)}ms`);

    // Clean up marks
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(measureName);
  } catch (error) {
    console.error('[Performance] Error measuring level start:', error);
  }
}

/**
 * Start measuring level start time
 * Call this when level initialization begins
 */
export function startLevelStartMeasure(levelNumber: number): void {
  try {
    performance.mark(`level-${levelNumber}-start`);
    
    // Start Firebase Performance trace
    const perf = getFirebasePerformance();
    if (perf) {
      const levelStartTrace = trace(perf, 'level_start');
      levelStartTrace.putAttribute('level_number', levelNumber.toString());
      levelStartTrace.start();
      // Store trace in a global variable so we can stop it later
      if (!(window as any).__levelStartTraces) {
        (window as any).__levelStartTraces = {};
      }
      (window as any).__levelStartTraces[levelNumber] = levelStartTrace;
    }
  } catch (error) {
    console.error('[Performance] Error starting level start measure:', error);
  }
}

/**
 * Start measuring score submission time
 * Call this when score submission begins
 */
export function startScoreSubmissionMeasure(): void {
  try {
    performance.mark('score-submission-start');
    
    // Start Firebase Performance trace
    const perf = getFirebasePerformance();
    if (perf) {
      const scoreSubmissionTrace = trace(perf, 'score_submission');
      scoreSubmissionTrace.start();
      // Store trace in a global variable so we can stop it later
      (window as any).__scoreSubmissionTrace = scoreSubmissionTrace;
    }
  } catch (error) {
    console.error('[Performance] Error starting score submission measure:', error);
  }
}

/**
 * Measure score submission time
 * Call this when score submission completes
 */
export function measureScoreSubmission(success: boolean): void {
  const startMark = 'score-submission-start';
  const endMark = 'score-submission-end';
  const measureName = 'score-submission-time';

  try {
    // Check if start mark exists
    const marks = performance.getEntriesByName(startMark);
    if (marks.length === 0) {
      console.warn('[Performance] score-submission-start mark not found');
      return;
    }

    // Mark end
    performance.mark(endMark);

    // Measure duration
    performance.measure(measureName, startMark, endMark);
    const measure = performance.getEntriesByName(measureName)[0];

    // Send to Sentry
    Sentry.setMeasurement('score_submission_time', measure.duration, 'millisecond');
    Sentry.setTag('submission_success', success.toString());

    // Stop Firebase Performance trace
    const scoreSubmissionTrace = (window as any).__scoreSubmissionTrace;
    if (scoreSubmissionTrace) {
      scoreSubmissionTrace.putMetric('duration_ms', measure.duration);
      scoreSubmissionTrace.putAttribute('success', success.toString());
      scoreSubmissionTrace.stop();
      delete (window as any).__scoreSubmissionTrace;
    }

    console.log(`[Performance] Score submission time: ${measure.duration.toFixed(2)}ms (success: ${success})`);

    // Clean up marks
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(measureName);
  } catch (error) {
    console.error('[Performance] Error measuring score submission:', error);
  }
}

/**
 * Measure frame rate during gameplay
 * Returns average FPS over the measurement period
 */
export function measureFrameRate(durationMs: number = 1000): Promise<number> {
  return new Promise((resolve) => {
    let frameCount = 0;
    const startTime = performance.now();

    function countFrame() {
      frameCount++;
      const elapsed = performance.now() - startTime;

      if (elapsed < durationMs) {
        requestAnimationFrame(countFrame);
      } else {
        const fps = Math.round((frameCount / elapsed) * 1000);
        
        // Send to Sentry
        Sentry.setMeasurement('frame_rate', fps, 'fps');
        
        // Log warning if FPS is low
        if (fps < 30) {
          Sentry.captureMessage('Low frame rate detected', {
            level: 'warning',
            contexts: {
              performance: {
                fps,
                threshold: 30,
              },
            },
          });
        }

        console.log(`[Performance] Average FPS: ${fps}`);
        resolve(fps);
      }
    }

    requestAnimationFrame(countFrame);
  });
}

/**
 * Track memory usage (if available)
 */
export function trackMemoryUsage(): void {
  // @ts-ignore - performance.memory is non-standard
  if (performance.memory) {
    // @ts-ignore
    const memory = performance.memory;
    const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
    const totalMB = Math.round(memory.jsHeapSizeLimit / 1048576);
    const usagePercent = Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100);

    Sentry.setMeasurement('memory_used_mb', usedMB, 'megabyte');
    Sentry.setMeasurement('memory_usage_percent', usagePercent, 'percent');

    // Log warning if memory usage is high
    if (usagePercent > 90) {
      Sentry.captureMessage('High memory usage detected', {
        level: 'warning',
        contexts: {
          memory: {
            usedMB,
            totalMB,
            usagePercent,
          },
        },
      });
    }

    console.log(`[Performance] Memory usage: ${usedMB}MB / ${totalMB}MB (${usagePercent}%)`);
  }
}

/**
 * Create and start a Firebase Performance trace
 * Returns a trace object that can be stopped later
 */
export function startFirebaseTrace(traceName: string): PerformanceTrace | null {
  try {
    const perf = getFirebasePerformance();
    if (!perf) {
      return null;
    }

    const traceInstance = trace(perf, traceName);
    traceInstance.start();
    return traceInstance;
  } catch (error) {
    console.error(`[Performance] Error starting trace ${traceName}:`, error);
    return null;
  }
}

/**
 * Stop a Firebase Performance trace and optionally add metrics/attributes
 */
export function stopFirebaseTrace(
  traceInstance: PerformanceTrace | null,
  metrics?: Record<string, number>,
  attributes?: Record<string, string>
): void {
  if (!traceInstance) {
    return;
  }

  try {
    // Add metrics
    if (metrics) {
      Object.entries(metrics).forEach(([key, value]) => {
        traceInstance.putMetric(key, value);
      });
    }

    // Add attributes
    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        traceInstance.putAttribute(key, value);
      });
    }

    traceInstance.stop();
  } catch (error) {
    console.error('[Performance] Error stopping trace:', error);
  }
}
