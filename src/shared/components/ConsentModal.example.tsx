/**
 * ConsentModal Usage Example
 * 
 * Demonstrates how to integrate ConsentModal with GDPRManager service
 */

import { useEffect, useState } from 'react';
import { ConsentModal } from './ConsentModal';
import { GDPRManager, ConsentType } from '@services/gdpr';

/**
 * Example: App-level integration
 */
export function AppWithConsent() {
  const [showConsentForm, setShowConsentForm] = useState(false);
  const [gdprManager] = useState(() => new GDPRManager());

  useEffect(() => {
    const initializeGDPR = async () => {
      // Initialize GDPR Manager
      await gdprManager.initialize();
      await gdprManager.start();

      // Check if consent form should be shown
      if (gdprManager.shouldShowConsentForm()) {
        setShowConsentForm(true);
      }
    };

    initializeGDPR();
  }, [gdprManager]);

  const handleConsent = async (consentType: ConsentType) => {
    try {
      await gdprManager.updateConsent(consentType);
      setShowConsentForm(false);
      console.log('Consent updated:', consentType);
    } catch (error) {
      console.error('Failed to update consent:', error);
    }
  };

  return (
    <div>
      {showConsentForm && (
        <ConsentModal
          onConsent={handleConsent}
          privacyPolicyUrl="https://fluxgrid.app/privacy"
        />
      )}
      
      {/* Rest of your app */}
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white">FluxGrid</h1>
        <p className="text-gray-400">Your game content here...</p>
      </div>
    </div>
  );
}

/**
 * Example: Settings screen integration
 */
export function SettingsWithConsentManagement() {
  const [showConsentForm, setShowConsentForm] = useState(false);
  const [gdprManager] = useState(() => new GDPRManager());
  const [consentStatus, setConsentStatus] = useState(gdprManager.getConsentStatus());

  useEffect(() => {
    const initialize = async () => {
      await gdprManager.initialize();
      await gdprManager.start();
      setConsentStatus(gdprManager.getConsentStatus());
    };
    initialize();
  }, [gdprManager]);

  const handleChangeConsent = () => {
    setShowConsentForm(true);
  };

  const handleConsent = async (consentType: ConsentType) => {
    try {
      await gdprManager.updateConsent(consentType);
      setConsentStatus(gdprManager.getConsentStatus());
      setShowConsentForm(false);
    } catch (error) {
      console.error('Failed to update consent:', error);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-white mb-4">Privacy Settings</h2>
      
      {consentStatus.obtained && (
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <p className="text-gray-400 text-sm mb-2">Current consent:</p>
          <p className="text-white font-semibold">
            {consentStatus.consentType === ConsentType.PERSONALIZED
              ? 'Personalized Ads'
              : 'Non-Personalized Ads'}
          </p>
          <button
            onClick={handleChangeConsent}
            className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
          >
            Change Consent
          </button>
        </div>
      )}

      <a
        href="https://fluxgrid.app/privacy"
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 hover:text-blue-300 text-sm underline"
      >
        View Privacy Policy
      </a>

      {showConsentForm && (
        <ConsentModal
          onConsent={handleConsent}
          privacyPolicyUrl="https://fluxgrid.app/privacy"
        />
      )}
    </div>
  );
}
