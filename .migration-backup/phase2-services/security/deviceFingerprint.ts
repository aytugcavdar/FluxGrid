/**
 * Device Fingerprinting Service
 * 
 * Generates privacy-preserving device fingerprints for multi-account detection.
 * Does NOT include PII (no IMEI, MAC address, email, phone, etc.)
 * 
 * Requirements: 3.1, 3.2, 3.8, 3.9
 */

import { Device } from '@capacitor/device';
import { logger, LogCategory } from '../logging/logger';

/**
 * Device fingerprint structure
 */
export interface DeviceFingerprint {
  hash: string; // SHA-256 hash of components
  components: {
    deviceModel: string;
    osVersion: string;
    screenResolution: string;
    timezone: string;
    language: string;
  };
  generatedAt: number;
}

/**
 * Generate device fingerprint
 * 
 * Collects non-PII device characteristics and hashes them for privacy.
 * Fingerprint can be regenerated if device characteristics change significantly.
 * 
 * @returns DeviceFingerprint object with hash and components
 */
export async function generateDeviceFingerprint(): Promise<DeviceFingerprint> {
  try {
    // Collect device information
    const deviceInfo = await Device.getInfo();
    
    const components = {
      deviceModel: deviceInfo.model || 'unknown',
      osVersion: `${deviceInfo.platform || 'unknown'}-${deviceInfo.osVersion || 'unknown'}`,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
      language: navigator.language || 'unknown',
    };
    
    // Hash components for privacy
    const hash = await hashComponents(components);
    
    const fingerprint: DeviceFingerprint = {
      hash,
      components,
      generatedAt: Date.now(),
    };
    
    logger.info('[DeviceFingerprint] Generated fingerprint', {
      hash: hash.substring(0, 8) + '...', // Log only first 8 chars
      model: components.deviceModel,
    }, LogCategory.GENERAL);
    
    return fingerprint;
  } catch (error) {
    logger.error('[DeviceFingerprint] Failed to generate fingerprint', error, LogCategory.GENERAL);
    
    // Return fallback fingerprint
    return {
      hash: 'fallback-' + Date.now(),
      components: {
        deviceModel: 'unknown',
        osVersion: 'unknown',
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        timezone: 'unknown',
        language: navigator.language || 'unknown',
      },
      generatedAt: Date.now(),
    };
  }
}

/**
 * Hash device components using SHA-256
 * 
 * @param components - Device components to hash
 * @returns SHA-256 hash as hex string
 */
async function hashComponents(components: DeviceFingerprint['components']): Promise<string> {
  // Create string from components
  const componentString = JSON.stringify(components);
  
  // Use Web Crypto API for SHA-256
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(componentString);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      logger.error('[DeviceFingerprint] SHA-256 hashing failed', error, LogCategory.GENERAL);
    }
  }
  
  // Fallback: simple hash
  let hash = 0;
  for (let i = 0; i < componentString.length; i++) {
    const char = componentString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}

/**
 * Check if device characteristics have changed significantly
 * 
 * Compares current device info with stored fingerprint to detect changes.
 * Significant changes trigger fingerprint regeneration.
 * 
 * @param storedFingerprint - Previously stored fingerprint
 * @returns true if significant changes detected
 */
export async function hasDeviceChanged(storedFingerprint: DeviceFingerprint): Promise<boolean> {
  try {
    const currentFingerprint = await generateDeviceFingerprint();
    
    // Compare components (ignore hash and timestamp)
    const stored = storedFingerprint.components;
    const current = currentFingerprint.components;
    
    // Check for significant changes
    const modelChanged = stored.deviceModel !== current.deviceModel;
    const osChanged = stored.osVersion !== current.osVersion;
    const resolutionChanged = stored.screenResolution !== current.screenResolution;
    
    // Timezone and language changes are not significant
    
    if (modelChanged || osChanged || resolutionChanged) {
      logger.info('[DeviceFingerprint] Significant device changes detected', {
        modelChanged,
        osChanged,
        resolutionChanged,
      }, LogCategory.GENERAL);
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error('[DeviceFingerprint] Failed to check device changes', error, LogCategory.GENERAL);
    return false;
  }
}

/**
 * Validate fingerprint structure
 * 
 * Ensures fingerprint has all required fields and no PII.
 * 
 * @param fingerprint - Fingerprint to validate
 * @returns true if valid
 */
export function isValidFingerprint(fingerprint: any): fingerprint is DeviceFingerprint {
  if (!fingerprint || typeof fingerprint !== 'object') {
    return false;
  }
  
  // Check required fields
  if (!fingerprint.hash || typeof fingerprint.hash !== 'string') {
    return false;
  }
  
  if (!fingerprint.components || typeof fingerprint.components !== 'object') {
    return false;
  }
  
  const components = fingerprint.components;
  const requiredFields = ['deviceModel', 'osVersion', 'screenResolution', 'timezone', 'language'];
  
  for (const field of requiredFields) {
    if (!components[field] || typeof components[field] !== 'string') {
      return false;
    }
  }
  
  // Check for PII (should not contain email, phone, IMEI, MAC, etc.)
  const fingerprintString = JSON.stringify(fingerprint).toLowerCase();
  const piiPatterns = [
    /@/, // Email
    /\d{10,}/, // Phone numbers (10+ digits)
    /imei/,
    /mac.*address/,
    /serial/,
  ];
  
  for (const pattern of piiPatterns) {
    if (pattern.test(fingerprintString)) {
      logger.warn('[DeviceFingerprint] PII detected in fingerprint', undefined, LogCategory.GENERAL);
      return false;
    }
  }
  
  return true;
}
