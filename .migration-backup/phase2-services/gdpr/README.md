# GDPR Manager Service

## Overview

The GDPR Manager service handles GDPR compliance and user consent for personalized ads in FluxGrid. It detects EEA region users, manages consent storage, and integrates with AdMob for personalized/non-personalized ad delivery.

## Features

- **EEA Region Detection**: Automatically detects if user is in European Economic Area based on browser language
- **Consent Storage**: Persists user consent choices in localStorage
- **Consent Versioning**: Tracks consent version and prompts for re-consent when version changes
- **AdMob Integration**: Provides consent type for ad requests (personalized vs non-personalized)
- **UMP SDK Ready**: Prepared for Google User Messaging Platform SDK integration

## Requirements Covered

- **1.1**: EEA region detection
- **1.2**: Consent form display and storage
- **1.4**: Consent persistence in localStorage
- **1.8**: Consent versioning system

## Usage

### Basic Setup

```typescript
import { GDPRManager, ConsentType } from '@/services/gdpr';

// Create instance
const gdprManager = new GDPRManager();

// Initialize
await gdprManager.initialize();
await gdprManager.start();

// Check if consent is required
if (gdprManager.isConsentRequired()) {
  // User is in EEA region
  if (gdprManager.shouldShowConsentForm()) {
    // Show consent form to user
  }
}
```

### Updating Consent

```typescript
// User selected personalized ads
await gdprManager.updateConsent(ConsentType.PERSONALIZED);

// User selected non-personalized ads
await gdprManager.updateConsent(ConsentType.NON_PERSONALIZED);
```

### Getting Consent Status

```typescript
const status = gdprManager.getConsentStatus();
console.log('Consent obtained:', status.obtained);
console.log('Consent type:', status.consentType);
console.log('Consent version:', status.version);
console.log('Consent timestamp:', status.timestamp);
```

### AdMob Integration

```typescript
// Get consent type for ad requests
const consentType = gdprManager.getConsentTypeForAds();

// Use with AdMob
if (consentType === ConsentType.PERSONALIZED) {
  // Request personalized ads
} else {
  // Request non-personalized ads
}
```

### Resetting Consent

```typescript
// Reset consent (for testing or user request)
await gdprManager.resetConsent();
```

## API Reference

### ConsentType Enum

```typescript
enum ConsentType {
  PERSONALIZED = 'personalized',
  NON_PERSONALIZED = 'non-personalized',
  NONE = 'none'
}
```

### ConsentStatus Interface

```typescript
interface ConsentStatus {
  required: boolean;        // Is consent required (EEA region)
  obtained: boolean;        // Has consent been obtained
  consentType: ConsentType; // Type of consent
  version: string;          // Consent version
  timestamp: number;        // When consent was given
}
```

### Methods

#### `isConsentRequired(): boolean`
Returns true if user is in EEA region and consent is required.

#### `getConsentStatus(): ConsentStatus`
Returns current consent status.

#### `updateConsent(consentType: ConsentType): Promise<void>`
Updates user consent choice and stores in localStorage.

#### `resetConsent(): Promise<void>`
Resets consent (clears localStorage and in-memory state).

#### `isConsentVersionOutdated(): boolean`
Returns true if stored consent version is outdated.

#### `shouldShowConsentForm(): boolean`
Returns true if consent form should be shown (required and not obtained, or version outdated).

#### `getConsentTypeForAds(): ConsentType`
Returns consent type to use for AdMob ad requests.

## EEA Countries

The service detects the following EEA countries:
- Austria (AT), Belgium (BE), Bulgaria (BG), Croatia (HR), Cyprus (CY)
- Czech Republic (CZ), Denmark (DK), Estonia (EE), Finland (FI), France (FR)
- Germany (DE), Greece (GR), Hungary (HU), Iceland (IS), Ireland (IE)
- Italy (IT), Latvia (LV), Liechtenstein (LI), Lithuania (LT), Luxembourg (LU)
- Malta (MT), Netherlands (NL), Norway (NO), Poland (PL), Portugal (PT)
- Romania (RO), Slovakia (SK), Slovenia (SI), Spain (ES), Sweden (SE)
- United Kingdom (GB)

## Storage Keys

The service uses the following localStorage keys:
- `gdpr:consent` - Consent type (personalized/non-personalized/none)
- `gdpr:consent_version` - Consent version (e.g., "1.0")
- `gdpr:consent_timestamp` - Timestamp when consent was given

## Testing

Run unit tests:
```bash
npm run test -- src/services/gdpr/gdprManager.test.ts --run
```

Test coverage includes:
- EEA region detection for various languages
- Consent storage and retrieval
- Consent versioning
- AdMob integration
- Error handling

## Future Enhancements

- Google UMP SDK integration for advanced consent management
- CCPA compliance for California users
- Consent analytics tracking
- Multi-language consent form
