/**
 * Production Setup Component
 * 
 * Wraps the app with production-ready features:
 * - Error Boundary
 * - GDPR Consent Check
 * - Service Initialization
 * - Performance Monitoring
 * 
 * Requirements: 1.1, 2.9, All requirements
 */

import React, { useEffect, useState } from 'react';
import { ErrorBoundary } from '../shared/components/ErrorBoundary';
import { ConsentModal } from '../shared/components/ConsentModal';
import { initializeProductionServices, serviceInitializer } from './serviceInitializer';
import { logger } from './logging/logger';
import { gdprManager } from './gdpr/gdprManager';

interface ProductionSetupProps {
  children: React.ReactNode;
}

interface SetupState {
  servicesReady: boolean;
  consentRequired: boolean;
  consentObtained: boolean;
  error: Error | null;
}

/**
 * Production Setup Component
 * Initializes all production services and handles GDPR consent
 */
export const ProductionSetup: React.FC<ProductionSetupProps> = ({ children }) => {
  const [state, setState] = useState<SetupState>({
    servicesReady: false,
    consentRequired: false,
    consentObtained: false,
    error: null,
  });

  useEffect(() => {
    initializeServices();
  }, []);

  const initializeServices = async () => {
    try {
      logger.info('Starting production setup...');

      // Initialize all services
      await initializeProductionServices();

      // Check GDPR consent
      const consentStatus = await gdprManager.getConsentStatus();
      
      if (consentStatus.required && !consentStatus.obtained) {
        setState({
          servicesReady: true,
          consentRequired: true,
          consentObtained: false,
          error: null,
        });
      } else {
        setState({
          servicesReady: true,
          consentRequired: false,
          consentObtained: true,
          error: null,
        });
      }

      // Log service health
      const health = serviceInitializer.getHealthStatus();
      logger.info('Service health status', { health });

      logger.info('✓ Production setup complete');
    } catch (error) {
      logger.critical('Production setup failed', { error });
      setState({
        servicesReady: false,
        consentRequired: false,
        consentObtained: false,
        error: error as Error,
      });
    }
  };

  const handleConsentGranted = async (consentType: 'personalized' | 'non-personalized') => {
    try {
      await gdprManager.setConsent(consentType);
      setState((prev) => ({
        ...prev,
        consentRequired: false,
        consentObtained: true,
      }));
      logger.info('GDPR consent granted', { consentType });
    } catch (error) {
      logger.error('Failed to save consent', { error });
    }
  };

  // Show loading while services initialize
  if (!state.servicesReady) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#1a1a2e',
        color: '#fff',
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>FluxGrid</h2>
          <p>Initializing...</p>
        </div>
      </div>
    );
  }

  // Show error if initialization failed
  if (state.error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#1a1a2e',
        color: '#fff',
      }}>
        <div style={{ textAlign: 'center', maxWidth: '500px', padding: '20px' }}>
          <h2>Initialization Error</h2>
          <p>{state.error.message}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: '#533483',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show consent modal if required
  if (state.consentRequired && !state.consentObtained) {
    return (
      <ConsentModal
        isOpen={true}
        onConsent={handleConsentGranted}
      />
    );
  }

  // Wrap app with error boundary
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
};
