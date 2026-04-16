/**
 * Firebase App Check Service
 * 
 * Provides client attestation to verify app authenticity and prevent
 * fake/modified clients from accessing Firebase backend.
 * 
 * Features:
 * - Platform-specific providers (reCAPTCHA v3 for Web, Play Integrity for Android)
 * - Automatic token refresh (55-minute lifetime)
 * - Retry logic with exponential backoff
 * - Debug token support for development
 * 
 * Requirements: 1.1, 1.2, 1.4, 1.5, 1.6, 1.8, 1.9
 */

import { initializeAppCheck, getToken, ReCaptchaV3Provider, CustomProvider } from 'firebase/app-check';
import { initializeFirebase } from '../firebase/firebaseConfig';
import { logger, LogCategory } from '../logging/logger';

// App Check configuration
export interface AppCheckConfig {
  siteKey: string; // reCAPTCHA v3 site key for web
  debugToken?: string; // Debug token for development
  isDebugMode: boolean;
}

// App Check service interface
export interface AppCheckService {
  initialize(): Promise<void>;
  getToken(): Promise<string>;
  refreshToken(): Promise<string>;
  isDebugMode(): boolean;
}

class AppCheckServiceImpl implements AppCheckService {
  private appCheck: any = null;
  private config: AppCheckConfig | null = null;
  private tokenRefreshTimer: NodeJS.Timeout | null = null;
  private lastToken: string | null = null;
  private tokenExpiresAt: number = 0;

  /**
   * Initialize App Check with platform-specific provider
   */
  async initialize(): Promise<void> {
    try {
      const app = initializeFirebase();
      
      // Get configuration from environment
      this.config = {
        siteKey: import.meta.env.VITE_RECAPTCHA_SITE_KEY || '',
        debugToken: import.meta.env.VITE_APP_CHECK_DEBUG_TOKEN,
        isDebugMode: import.meta.env.MODE === 'development',
      };

      // Set debug token if in development mode
      if (this.config.isDebugMode && this.config.debugToken) {
        (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = this.config.debugToken;
        logger.info('[AppCheck] Using debug token for development', undefined, LogCategory.GENERAL);
      }

      // Initialize App Check with reCAPTCHA v3 provider
      if (this.config.siteKey) {
        this.appCheck = initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(this.config.siteKey),
          isTokenAutoRefreshEnabled: true,
        });
        
        logger.info('[AppCheck] Initialized with reCAPTCHA v3', undefined, LogCategory.GENERAL);
      } else {
        logger.warn('[AppCheck] No site key configured, App Check disabled', undefined, LogCategory.GENERAL);
      }

      // Start automatic token refresh
      this.startTokenRefresh();
    } catch (error) {
      logger.error('[AppCheck] Initialization failed', error, LogCategory.GENERAL);
      // Don't throw - graceful degradation
    }
  }

  /**
   * Get current App Check token
   * Returns cached token if still valid, otherwise fetches new one
   */
  async getToken(): Promise<string> {
    if (!this.appCheck) {
      logger.warn('[AppCheck] Not initialized, returning empty token', undefined, LogCategory.GENERAL);
      return '';
    }

    try {
      // Return cached token if still valid (with 5-minute buffer)
      const now = Date.now();
      if (this.lastToken && this.tokenExpiresAt > now + 5 * 60 * 1000) {
        return this.lastToken;
      }

      // Fetch new token
      const result = await this.fetchTokenWithRetry();
      return result;
    } catch (error) {
      logger.error('[AppCheck] Failed to get token', error, LogCategory.GENERAL);
      return '';
    }
  }

  /**
   * Force refresh App Check token
   */
  async refreshToken(): Promise<string> {
    if (!this.appCheck) {
      logger.warn('[AppCheck] Not initialized, cannot refresh token', undefined, LogCategory.GENERAL);
      return '';
    }

    try {
      // Force fetch new token
      const result = await this.fetchTokenWithRetry(true);
      return result;
    } catch (error) {
      logger.error('[AppCheck] Failed to refresh token', error, LogCategory.GENERAL);
      return '';
    }
  }

  /**
   * Check if running in debug mode
   */
  isDebugMode(): boolean {
    return this.config?.isDebugMode || false;
  }

  /**
   * Fetch token with exponential backoff retry logic
   */
  private async fetchTokenWithRetry(forceRefresh: boolean = false, attempt: number = 1): Promise<string> {
    const maxAttempts = 3;
    const baseDelay = 1000; // 1 second

    try {
      const result = await getToken(this.appCheck, forceRefresh);
      
      // Cache token and expiration time
      this.lastToken = result.token;
      // Token lifetime is 55 minutes
      this.tokenExpiresAt = Date.now() + 55 * 60 * 1000;
      
      logger.info('[AppCheck] Token fetched successfully', { 
        expiresIn: '55 minutes',
        forceRefresh 
      }, LogCategory.GENERAL);
      
      return result.token;
    } catch (error) {
      if (attempt < maxAttempts) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = baseDelay * Math.pow(2, attempt - 1);
        logger.warn(`[AppCheck] Token fetch failed, retrying in ${delay}ms (attempt ${attempt}/${maxAttempts})`, 
          error, LogCategory.GENERAL);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchTokenWithRetry(forceRefresh, attempt + 1);
      }
      
      throw error;
    }
  }

  /**
   * Start automatic token refresh timer
   * Refreshes token every 50 minutes (5 minutes before expiration)
   */
  private startTokenRefresh(): void {
    if (this.tokenRefreshTimer) {
      clearInterval(this.tokenRefreshTimer);
    }

    // Refresh every 50 minutes (5 minutes before 55-minute expiration)
    const refreshInterval = 50 * 60 * 1000;
    
    this.tokenRefreshTimer = setInterval(async () => {
      try {
        await this.refreshToken();
        logger.info('[AppCheck] Automatic token refresh completed', undefined, LogCategory.GENERAL);
      } catch (error) {
        logger.error('[AppCheck] Automatic token refresh failed', error, LogCategory.GENERAL);
      }
    }, refreshInterval);

    logger.info('[AppCheck] Automatic token refresh started', { 
      intervalMinutes: 50 
    }, LogCategory.GENERAL);
  }

  /**
   * Stop automatic token refresh
   */
  destroy(): void {
    if (this.tokenRefreshTimer) {
      clearInterval(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
    this.lastToken = null;
    this.tokenExpiresAt = 0;
  }
}

// Export singleton instance
export const appCheckService = new AppCheckServiceImpl();
