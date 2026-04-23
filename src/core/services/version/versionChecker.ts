/**
 * Version Checker Service
 * 
 * Checks for app updates and manages version compatibility.
 * 
 * Features:
 * - Version comparison (semantic versioning)
 * - Update check frequency management
 * - Update dialog state tracking
 * - Remote Config integration for version info
 * - Multi-language update messages
 * 
 * Requirements: 15.7, 15.8
 */

import { BaseService } from '../base/BaseService';
import { logger, LogCategory } from '../logging/logger';

// Update check result
export interface UpdateCheckResult {
  updateAvailable: boolean;
  updateRequired: boolean;
  updateRecommended: boolean;
  currentVersion: string;
  latestVersion: string;
  minVersion: string;
  recommendedVersion: string;
}

// Version info from Remote Config
export interface VersionInfo {
  minVersion: string;
  latestVersion: string;
  recommendedVersion: string;
  releaseNotes: Record<string, string>; // language -> notes
}

/**
 * Version Checker Service
 * Manages app version checking and update notifications
 */
export class VersionChecker extends BaseService {
  private readonly CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
  private lastCheckTime: number | null = null;
  private shownDialogs: Set<string> = new Set();

  constructor() {
    super({
      name: 'VersionChecker',
      version: '1.0.0',
      dependencies: [],
    });
  }

  /**
   * Initialize version checker
   */
  protected async onInitialize(): Promise<void> {
    logger.info('[VersionChecker] Initializing version checker', undefined, LogCategory.GENERAL);

    // Load last check time from storage
    const lastCheck = localStorage.getItem('version:last_check');
    if (lastCheck) {
      this.lastCheckTime = parseInt(lastCheck, 10);
    }

    // Load shown dialogs from storage
    const shownDialogs = localStorage.getItem('version:shown_dialogs');
    if (shownDialogs) {
      try {
        const dialogs = JSON.parse(shownDialogs);
        this.shownDialogs = new Set(dialogs);
      } catch (error) {
        logger.error('[VersionChecker] Failed to parse shown dialogs', error, LogCategory.GENERAL);
      }
    }
  }

  /**
   * Start version checker
   */
  protected async onStart(): Promise<void> {
    logger.info('[VersionChecker] Starting version checker', undefined, LogCategory.GENERAL);
  }

  /**
   * Stop version checker
   */
  protected async onStop(): Promise<void> {
    logger.info('[VersionChecker] Stopping version checker', undefined, LogCategory.GENERAL);
  }

  /**
   * Check for updates
   */
  public async checkForUpdate(
    currentVersion: string,
    minVersion: string,
    recommendedVersion: string
  ): Promise<UpdateCheckResult> {
    logger.info('[VersionChecker] Checking for updates', {
      currentVersion,
      minVersion,
      recommendedVersion,
    }, LogCategory.GENERAL);

    // Update last check time
    this.lastCheckTime = Date.now();
    localStorage.setItem('version:last_check', this.lastCheckTime.toString());

    // Compare versions
    const isUpdateRequired = this.compareVersions(currentVersion, minVersion) < 0;
    const isUpdateRecommended = this.compareVersions(currentVersion, recommendedVersion) < 0;

    return {
      updateAvailable: isUpdateRecommended,
      updateRequired: isUpdateRequired,
      updateRecommended: isUpdateRecommended,
      currentVersion,
      latestVersion: recommendedVersion,
      minVersion,
      recommendedVersion,
    };
  }

  /**
   * Get update message in specified language
   */
  public getUpdateMessage(
    updateType: 'required' | 'recommended',
    language: string,
    versionInfo?: { currentVersion?: string; latestVersion?: string }
  ): string {
    const messages: Record<string, Record<string, string>> = {
      required: {
        en: `A required update is available. Please update to continue using the app.${versionInfo ? ` (Current: ${versionInfo.currentVersion}, Latest: ${versionInfo.latestVersion})` : ''}`,
        tr: `Zorunlu bir güncelleme mevcut. Uygulamayı kullanmaya devam etmek için lütfen güncelleyin.${versionInfo ? ` (Mevcut: ${versionInfo.currentVersion}, Son: ${versionInfo.latestVersion})` : ''}`,
        de: `Ein erforderliches Update ist verfügbar. Bitte aktualisieren Sie, um die App weiterhin zu verwenden.${versionInfo ? ` (Aktuell: ${versionInfo.currentVersion}, Neueste: ${versionInfo.latestVersion})` : ''}`,
        fr: `Une mise à jour requise est disponible. Veuillez mettre à jour pour continuer à utiliser l'application.${versionInfo ? ` (Actuel: ${versionInfo.currentVersion}, Dernier: ${versionInfo.latestVersion})` : ''}`,
        es: `Hay una actualización requerida disponible. Por favor, actualice para continuar usando la aplicación.${versionInfo ? ` (Actual: ${versionInfo.currentVersion}, Última: ${versionInfo.latestVersion})` : ''}`,
      },
      recommended: {
        en: `A new update is available. We recommend updating for the best experience.${versionInfo ? ` (Current: ${versionInfo.currentVersion}, Latest: ${versionInfo.latestVersion})` : ''}`,
        tr: `Yeni bir güncelleme mevcut. En iyi deneyim için güncellemenizi öneririz.${versionInfo ? ` (Mevcut: ${versionInfo.currentVersion}, Son: ${versionInfo.latestVersion})` : ''}`,
        de: `Ein neues Update ist verfügbar. Wir empfehlen ein Update für die beste Erfahrung.${versionInfo ? ` (Aktuell: ${versionInfo.currentVersion}, Neueste: ${versionInfo.latestVersion})` : ''}`,
        fr: `Une nouvelle mise à jour est disponible. Nous recommandons la mise à jour pour une meilleure expérience.${versionInfo ? ` (Actuel: ${versionInfo.currentVersion}, Dernier: ${versionInfo.latestVersion})` : ''}`,
        es: `Hay una nueva actualización disponible. Recomendamos actualizar para obtener la mejor experiencia.${versionInfo ? ` (Actual: ${versionInfo.currentVersion}, Última: ${versionInfo.latestVersion})` : ''}`,
      },
    };

    return messages[updateType][language] || messages[updateType]['en'];
  }

  /**
   * Get update URL for platform
   */
  public getUpdateURL(platform: 'android' | 'ios' | 'web', appId: string): string {
    switch (platform) {
      case 'android':
        return `https://play.google.com/store/apps/details?id=${appId}`;
      case 'ios':
        return `https://apps.apple.com/app/id${appId}`;
      case 'web':
        return appId; // appId is the URL for web
      default:
        return '';
    }
  }

  /**
   * Validate semantic version format
   */
  public isValidVersion(version: string): boolean {
    const semverRegex = /^\d+\.\d+\.\d+$/;
    return semverRegex.test(version);
  }

  /**
   * Check if should check for update based on frequency
   */
  public shouldCheckForUpdate(lastCheckTime: number | null, checkInterval: number): boolean {
    if (lastCheckTime === null) {
      return true; // First launch
    }

    const now = Date.now();
    const timeSinceLastCheck = now - lastCheckTime;
    return timeSinceLastCheck >= checkInterval;
  }

  /**
   * Mark update dialog as shown for version
   */
  public markUpdateDialogShown(version: string): void {
    this.shownDialogs.add(version);
    localStorage.setItem('version:shown_dialogs', JSON.stringify(Array.from(this.shownDialogs)));
  }

  /**
   * Check if update dialog was shown for version
   */
  public wasUpdateDialogShown(version: string): boolean {
    return this.shownDialogs.has(version);
  }

  /**
   * Check if should show update dialog for version
   */
  public shouldShowUpdateDialog(version: string): boolean {
    return !this.wasUpdateDialogShown(version);
  }

  /**
   * Compare two semantic versions
   * Returns: -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;

      if (part1 < part2) return -1;
      if (part1 > part2) return 1;
    }

    return 0;
  }
}

// Export singleton instance
export const versionChecker = new VersionChecker();

/**
 * Initialize version checker service
 */
export async function initializeVersionChecker(): Promise<VersionChecker> {
  await versionChecker.initialize();
  await versionChecker.start();
  return versionChecker;
}

/**
 * Check version and show update dialog if needed
 */
export async function checkVersionAndShowDialog(
  currentVersion: string,
  config: {
    minVersion: string;
    recommendedVersion: string;
    onUpdateRequired?: () => void;
    onUpdateRecommended?: () => void;
  }
): Promise<UpdateCheckResult> {
  const result = await versionChecker.checkForUpdate(
    currentVersion,
    config.minVersion,
    config.recommendedVersion
  );

  if (result.updateRequired && config.onUpdateRequired) {
    config.onUpdateRequired();
  } else if (result.updateRecommended && config.onUpdateRecommended) {
    config.onUpdateRecommended();
  }

  return result;
}

/**
 * Update dialog configuration
 */
export interface UpdateDialogConfig {
  title: string;
  message: string;
  updateButtonText: string;
  cancelButtonText?: string;
  updateUrl: string;
  canDismiss: boolean;
}
