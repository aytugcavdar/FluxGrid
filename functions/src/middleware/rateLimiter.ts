/**
 * Token Bucket Rate Limiter
 * 
 * Implements token bucket algorithm for rate limiting with IP-based tracking.
 * Prevents abuse and automated attacks on backend services.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.5, 4.9, 4.10
 */

import * as admin from 'firebase-admin';

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  perMinute: number; // Maximum requests per minute
  perHour: number; // Maximum requests per hour
  burstCapacity: number; // Maximum burst capacity
}

/**
 * Token bucket state
 */
interface TokenBucket {
  tokens: number;
  lastRefill: number;
  violations: number; // Track repeated violations for exponential backoff
}

/**
 * Default rate limit configurations
 */
const DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
  score_submission: {
    perMinute: 10,
    perHour: 100,
    burstCapacity: 15,
  },
  leaderboard_fetch: {
    perMinute: 30,
    perHour: 500,
    burstCapacity: 50,
  },
};

/**
 * Fetch rate limit config from Firebase Remote Config
 * Falls back to default if Remote Config is unavailable
 * 
 * @param action - Action to get config for
 * @returns Rate limit configuration
 */
async function getRateLimitConfig(action: string): Promise<RateLimitConfig> {
  try {
    // Try to fetch from Remote Config
    const configDoc = await admin.firestore().doc('config/rate_limits').get();
    if (configDoc.exists) {
      const configs = configDoc.data();
      if (configs && configs[action]) {
        return configs[action] as RateLimitConfig;
      }
    }
  } catch (error) {
    console.warn('[RateLimit] Failed to fetch Remote Config, using defaults', error);
  }

  // Fallback to defaults
  return DEFAULT_CONFIGS[action] || DEFAULT_CONFIGS.score_submission;
}

/**
 * Token Bucket Rate Limiter class
 */
export class TokenBucketRateLimiter {
  private buckets = new Map<string, TokenBucket>();

  /**
   * Check rate limit for IP address
   * 
   * @param ip - IP address to check
   * @param action - Action being rate limited
   * @param config - Rate limit configuration (optional, uses defaults)
   * @returns true if allowed, false if rate limited
   */
  async checkLimit(
    ip: string,
    action: string,
    config?: RateLimitConfig
  ): Promise<boolean> {
    // Fetch config from Remote Config if not provided
    const finalConfig = config || await getRateLimitConfig(action);
    const bucketKey = `${ip}:${action}`;
    
    // Get or create bucket
    let bucket = await this.getBucket(bucketKey);
    if (!bucket) {
      bucket = {
        tokens: finalConfig.burstCapacity,
        lastRefill: Date.now(),
        violations: 0,
      };
    }

    // Refill tokens based on elapsed time
    const now = Date.now();
    const elapsedSeconds = (now - bucket.lastRefill) / 1000;
    const tokensToAdd = elapsedSeconds * (finalConfig.perMinute / 60);
    bucket.tokens = Math.min(finalConfig.burstCapacity, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;

    // Check if enough tokens
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      bucket.violations = 0; // Reset violations on successful request
      await this.saveBucket(bucketKey, bucket);
      return true;
    }

    // Rate limited - increment violations
    bucket.violations += 1;
    await this.saveBucket(bucketKey, bucket);
    await this.logViolation(ip, action, bucket.violations);
    
    console.warn(`[RateLimit] Rate limit exceeded for ${ip} on ${action}`, {
      tokens: bucket.tokens,
      violations: bucket.violations,
    });

    return false;
  }

  /**
   * Get token bucket from Firestore
   */
  private async getBucket(key: string): Promise<TokenBucket | null> {
    // Check in-memory cache first
    if (this.buckets.has(key)) {
      return this.buckets.get(key)!;
    }

    try {
      const doc = await admin.firestore().doc(`rate_limits/${key}`).get();
      if (doc.exists) {
        const data = doc.data();
        return {
          tokens: data?.tokens || 0,
          lastRefill: data?.lastRefill || Date.now(),
          violations: data?.violations || 0,
        };
      }
    } catch (error) {
      console.error('[RateLimit] Error getting bucket', error);
    }

    return null;
  }

  /**
   * Save token bucket to Firestore
   */
  private async saveBucket(key: string, bucket: TokenBucket): Promise<void> {
    // Update in-memory cache
    this.buckets.set(key, bucket);

    try {
      // Save to Firestore with TTL (1 hour)
      await admin.firestore().doc(`rate_limits/${key}`).set({
        tokens: bucket.tokens,
        lastRefill: bucket.lastRefill,
        violations: bucket.violations,
        expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 60 * 60 * 1000),
      });
    } catch (error) {
      console.error('[RateLimit] Error saving bucket', error);
    }
  }

  /**
   * Log rate limit violation
   */
  private async logViolation(ip: string, action: string, violations: number): Promise<void> {
    try {
      await admin.firestore().collection('rate_limit_violations').add({
        ip,
        action,
        violations,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('[RateLimit] Error logging violation', error);
    }
  }

  /**
   * Calculate exponential backoff duration
   * 
   * @param violations - Number of violations
   * @returns Backoff duration in seconds
   */
  getBackoffDuration(violations: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 60s
    return Math.min(Math.pow(2, violations - 1), 60);
  }
}

/**
 * Extract IP address from request
 * Handles Cloudflare and Firebase Hosting headers
 * 
 * @param request - HTTP request object
 * @returns IP address
 */
export function extractIpAddress(request: any): string {
  // Check Cloudflare header first
  const cfConnectingIp = request.headers['cf-connecting-ip'];
  if (cfConnectingIp) {
    return Array.isArray(cfConnectingIp) ? cfConnectingIp[0] : cfConnectingIp;
  }

  // Check X-Forwarded-For header (Firebase Hosting)
  const xForwardedFor = request.headers['x-forwarded-for'];
  if (xForwardedFor) {
    const ips = Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor;
    return ips.split(',')[0].trim();
  }

  // Fallback to direct IP
  return request.ip || 'unknown';
}

// Export singleton instance
export const rateLimiter = new TokenBucketRateLimiter();
