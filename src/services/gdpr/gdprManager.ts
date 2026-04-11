/**
 * GDPR Manager Service
 * 
 * Manages GDPR compliance and user consent for personalized ads.
 * Handles EEA region detection, consent storage, and versioning.
 * 
 * Requirements: 1.1, 1.2, 1.4, 1.8
 */

import { BaseService } from '../core/BaseService';

export enum ConsentType {
  PERSONALIZED = 'personalized',
  NON_PERSONALIZED = 'non-personalized',
  NONE = 'none'
}

export interface ConsentStatus {
  required: boolean;
  obtained: boolean;
  consentType: ConsentType;
  version: string;
  timestamp: number;
}

// EEA country codes (European Economic Area)
const EEA_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IS', 'IE', 'IT', 'LV', 'LI', 'LT', 'LU',
  'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB'
];

const CONSENT_VERSION = '1.0';
const STORAGE_KEY_CONSENT_TYPE = 'gdpr:consent';
const STORAGE_KEY_CONSENT_VERSION = 'gdpr:consent_version';
const STORAGE_KEY_CONSENT_TIMESTAMP = 'gdpr:consent_timestamp';

export class GDPRManager extends BaseService {
  private consentRequired: boolean = false;
  private currentConsent: ConsentStatus = {
    required: false,
    obtained: false,
    consentType: ConsentType.NONE,
    version: CONSENT_VERSION,
    timestamp: 0
  };

  constructor() {
    super({
      name: 'GDPRManager',
      version: '1.0.0',
      dependencies: []
    });
  }

  /**
   * Initialize: Detect EEA region and load stored consent
   */
  protected async onInitialize(): Promise<void> {
    // Detect if user is in EEA region
    this.consentRequired = this.detectEEARegion();

    // Load stored consent
    this.loadStoredConsent();

    console.log(`[${this.metadata.name}] Initialized - Consent required: ${this.consentRequired}`);
  }

  /**
   * Start: Service is ready
   */
  protected async onStart(): Promise<void> {
    console.log(`[${this.metadata.name}] Started`);
  }

  /**
   * Stop: Cleanup
   */
  protected async onStop(): Promise<void> {
    console.log(`[${this.metadata.name}] Stopped`);
  }

  /**
   * Detect if user is in EEA region based on browser language
   * Requirements: 1.1
   */
  private detectEEARegion(): boolean {
    try {
      // Get browser language (e.g., "en-GB", "de-DE", "fr-FR")
      const language = navigator.language || (navigator as any).userLanguage || 'en-US';
      
      // Extract country code (last 2 characters)
      const countryCode = language.split('-')[1]?.toUpperCase();
      
      if (!countryCode) {
        return false;
      }

      // Check if country is in EEA
      return EEA_COUNTRIES.includes(countryCode);
    } catch (error) {
      console.error(`[${this.metadata.name}] Error detecting EEA region:`, error);
      // Default to requiring consent if detection fails (safer approach)
      return true;
    }
  }

  /**
   * Load stored consent from localStorage
   * Requirements: 1.4
   */
  private loadStoredConsent(): void {
    try {
      const storedType = localStorage.getItem(STORAGE_KEY_CONSENT_TYPE);
      const storedVersion = localStorage.getItem(STORAGE_KEY_CONSENT_VERSION);
      const storedTimestamp = localStorage.getItem(STORAGE_KEY_CONSENT_TIMESTAMP);

      // Validate stored data
      const isValidConsentType = storedType && Object.values(ConsentType).includes(storedType as ConsentType);
      const isValidTimestamp = storedTimestamp && !isNaN(parseInt(storedTimestamp, 10));

      if (isValidConsentType && storedVersion && isValidTimestamp) {
        this.currentConsent = {
          required: this.consentRequired,
          obtained: true,
          consentType: storedType as ConsentType,
          version: storedVersion,
          timestamp: parseInt(storedTimestamp, 10)
        };
      } else {
        this.currentConsent = {
          required: this.consentRequired,
          obtained: false,
          consentType: ConsentType.NONE,
          version: CONSENT_VERSION,
          timestamp: 0
        };
      }
    } catch (error) {
      console.error(`[${this.metadata.name}] Error loading stored consent:`, error);
      this.currentConsent = {
        required: this.consentRequired,
        obtained: false,
        consentType: ConsentType.NONE,
        version: CONSENT_VERSION,
        timestamp: 0
      };
    }
  }

  /**
   * Check if consent is required (EEA region)
   * Requirements: 1.1
   */
  public isConsentRequired(): boolean {
    return this.consentRequired;
  }

  /**
   * Get current consent status
   * Requirements: 1.2
   */
  public getConsentStatus(): ConsentStatus {
    return { ...this.currentConsent };
  }

  /**
   * Update user consent
   * Requirements: 1.2, 1.4
   */
  public async updateConsent(consentType: ConsentType): Promise<void> {
    try {
      const timestamp = Date.now();

      // Update in-memory state
      this.currentConsent = {
        required: this.consentRequired,
        obtained: true,
        consentType,
        version: CONSENT_VERSION,
        timestamp
      };

      // Store in localStorage
      localStorage.setItem(STORAGE_KEY_CONSENT_TYPE, consentType);
      localStorage.setItem(STORAGE_KEY_CONSENT_VERSION, CONSENT_VERSION);
      localStorage.setItem(STORAGE_KEY_CONSENT_TIMESTAMP, timestamp.toString());

      console.log(`[${this.metadata.name}] Consent updated:`, consentType);

      // TODO: Integrate with Google UMP SDK when available
      // await this.updateUMPConsent(consentType);
    } catch (error) {
      console.error(`[${this.metadata.name}] Error updating consent:`, error);
      throw new Error('Failed to update consent');
    }
  }

  /**
   * Reset consent (for testing or user request)
   * Requirements: 1.7
   */
  public async resetConsent(): Promise<void> {
    try {
      // Clear localStorage
      localStorage.removeItem(STORAGE_KEY_CONSENT_TYPE);
      localStorage.removeItem(STORAGE_KEY_CONSENT_VERSION);
      localStorage.removeItem(STORAGE_KEY_CONSENT_TIMESTAMP);

      // Reset in-memory state
      this.currentConsent = {
        required: this.consentRequired,
        obtained: false,
        consentType: ConsentType.NONE,
        version: CONSENT_VERSION,
        timestamp: 0
      };

      console.log(`[${this.metadata.name}] Consent reset`);
    } catch (error) {
      console.error(`[${this.metadata.name}] Error resetting consent:`, error);
      throw new Error('Failed to reset consent');
    }
  }

  /**
   * Check if consent version is outdated
   * Requirements: 1.8
   */
  public isConsentVersionOutdated(): boolean {
    if (!this.currentConsent.obtained) {
      return false;
    }

    return this.currentConsent.version !== CONSENT_VERSION;
  }

  /**
   * Check if consent needs to be shown
   * (Required and not obtained, or version outdated)
   */
  public shouldShowConsentForm(): boolean {
    if (!this.consentRequired) {
      return false;
    }

    return !this.currentConsent.obtained || this.isConsentVersionOutdated();
  }

  /**
   * Get consent type for AdMob integration
   * Requirements: 1.9
   */
  public getConsentTypeForAds(): ConsentType {
    if (!this.consentRequired) {
      // Non-EEA users can have personalized ads by default
      return ConsentType.PERSONALIZED;
    }

    if (!this.currentConsent.obtained) {
      // No consent obtained yet - use non-personalized
      return ConsentType.NON_PERSONALIZED;
    }

    return this.currentConsent.consentType;
  }
}

// Export singleton instance
export const gdprManager = new GDPRManager();
