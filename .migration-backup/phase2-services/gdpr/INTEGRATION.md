# GDPR Manager Integration Guide

## Registering with ServiceContainer

To integrate the GDPR Manager with the application's ServiceContainer:

```typescript
// src/app/services.ts or similar initialization file
import { getServiceContainer } from '@/services/core/ServiceContainer';
import { GDPRManager } from '@/services/gdpr';

export function registerServices() {
  const container = getServiceContainer();

  // Register GDPR Manager
  container.register('gdprManager', () => new GDPRManager(), true);

  // Register other services...
}

export async function initializeServices() {
  const container = getServiceContainer();
  
  // Initialize all services
  await container.initializeAll();
  
  // Start all services
  await container.startAll();
}
```

## Using in React Components

### App Entry Point

```typescript
// src/app/index.tsx
import { useEffect, useState } from 'react';
import { getServiceContainer } from '@/services/core/ServiceContainer';
import { GDPRManager } from '@/services/gdpr';
import { ConsentModal } from '@/components/ConsentModal';

function App() {
  const [showConsentForm, setShowConsentForm] = useState(false);
  const [gdprManager, setGdprManager] = useState<GDPRManager | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      // Get GDPR Manager from container
      const container = getServiceContainer();
      const manager = container.resolve<GDPRManager>('gdprManager');
      setGdprManager(manager);

      // Check if consent form should be shown
      if (manager.shouldShowConsentForm()) {
        setShowConsentForm(true);
      }
    };

    initializeApp();
  }, []);

  return (
    <>
      {showConsentForm && gdprManager && (
        <ConsentModal
          onConsent={async (consentType) => {
            await gdprManager.updateConsent(consentType);
            setShowConsentForm(false);
          }}
        />
      )}
      {/* Rest of app */}
    </>
  );
}
```

### Settings Screen

```typescript
// src/app/SettingsScreen.tsx
import { getServiceContainer } from '@/services/core/ServiceContainer';
import { GDPRManager, ConsentType } from '@/services/gdpr';

function SettingsScreen() {
  const gdprManager = getServiceContainer().resolve<GDPRManager>('gdprManager');
  const consentStatus = gdprManager.getConsentStatus();

  const handleChangeConsent = async () => {
    // Show consent form again
    const newConsent = await showConsentFormDialog();
    await gdprManager.updateConsent(newConsent);
  };

  return (
    <div>
      <h2>Privacy Settings</h2>
      {consentStatus.obtained && (
        <div>
          <p>Current consent: {consentStatus.consentType}</p>
          <button onClick={handleChangeConsent}>
            Change Consent
          </button>
        </div>
      )}
      <a href="https://your-privacy-policy-url.com" target="_blank">
        Privacy Policy
      </a>
    </div>
  );
}
```

## AdMob Integration

```typescript
// src/utils/adManager.ts
import { getServiceContainer } from '@/services/core/ServiceContainer';
import { GDPRManager, ConsentType } from '@/services/gdpr';
import { AdMob } from '@capacitor-community/admob';

export class AdManager {
  private gdprManager: GDPRManager;

  constructor() {
    this.gdprManager = getServiceContainer().resolve<GDPRManager>('gdprManager');
  }

  async showInterstitial() {
    const consentType = this.gdprManager.getConsentTypeForAds();
    
    const options = {
      adId: 'YOUR_AD_UNIT_ID',
      // Configure based on consent
      npa: consentType === ConsentType.NON_PERSONALIZED ? '1' : '0'
    };

    await AdMob.prepareInterstitial(options);
    await AdMob.showInterstitial();
  }

  async showRewarded() {
    const consentType = this.gdprManager.getConsentTypeForAds();
    
    const options = {
      adId: 'YOUR_REWARDED_AD_UNIT_ID',
      npa: consentType === ConsentType.NON_PERSONALIZED ? '1' : '0'
    };

    await AdMob.prepareRewardVideoAd(options);
    const result = await AdMob.showRewardVideoAd();
    return result;
  }
}
```

## Testing Integration

```typescript
// src/services/gdpr/integration.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { getServiceContainer } from '@/services/core/ServiceContainer';
import { GDPRManager } from '@/services/gdpr';

describe('GDPR Manager Integration', () => {
  beforeEach(() => {
    const container = getServiceContainer();
    container.clear();
    container.register('gdprManager', () => new GDPRManager(), true);
  });

  it('should be registered in service container', () => {
    const container = getServiceContainer();
    expect(container.has('gdprManager')).toBe(true);
  });

  it('should resolve from service container', () => {
    const container = getServiceContainer();
    const manager = container.resolve<GDPRManager>('gdprManager');
    expect(manager).toBeInstanceOf(GDPRManager);
  });

  it('should be singleton', () => {
    const container = getServiceContainer();
    const manager1 = container.resolve<GDPRManager>('gdprManager');
    const manager2 = container.resolve<GDPRManager>('gdprManager');
    expect(manager1).toBe(manager2);
  });

  it('should initialize successfully', async () => {
    const container = getServiceContainer();
    await container.initializeAll();
    
    const manager = container.resolve<GDPRManager>('gdprManager');
    expect(manager.getStatus()).toBe('initialized');
  });
});
```

## Health Check

```typescript
// Check service health
const container = getServiceContainer();
const healthStatus = container.getHealthStatus();

console.log('GDPR Manager Health:', healthStatus.gdprManager);
// Output: { status: 'running', healthy: true }
```

## Lifecycle Management

```typescript
// Stop all services (e.g., on app shutdown)
await container.stopAll();

// Restart a specific service
const manager = container.resolve<GDPRManager>('gdprManager');
await manager.stop();
await manager.start();
```
