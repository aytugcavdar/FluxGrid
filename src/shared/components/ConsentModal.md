# ConsentModal Component

## Overview

The `ConsentModal` component is a GDPR-compliant consent form that allows users to choose between personalized and non-personalized ads. It's designed to be shown to EEA users on first launch or when the consent version changes.

**Requirements:** 1.3, 1.5, 1.7

## Features

- ✅ Two consent options: Personalized and Non-Personalized ads
- ✅ Privacy policy link with customizable URL
- ✅ Loading state during submission
- ✅ Error handling for failed submissions
- ✅ Accessible keyboard navigation
- ✅ Responsive design
- ✅ Cyberpunk-themed UI matching FluxGrid design

## Usage

### Basic Usage

```tsx
import { ConsentModal } from '@/components';
import { ConsentType } from '@services/gdpr';

function App() {
  const [showConsent, setShowConsent] = useState(true);

  const handleConsent = async (consentType: ConsentType) => {
    // Update consent in your GDPR manager
    await gdprManager.updateConsent(consentType);
    setShowConsent(false);
  };

  return (
    <>
      {showConsent && <ConsentModal onConsent={handleConsent} />}
      {/* Rest of your app */}
    </>
  );
}
```

### With Custom Privacy Policy URL

```tsx
<ConsentModal
  onConsent={handleConsent}
  privacyPolicyUrl="https://your-domain.com/privacy"
/>
```

### Integration with GDPRManager

```tsx
import { useEffect, useState } from 'react';
import { ConsentModal } from '@/components';
import { GDPRManager } from '@services/gdpr';

function App() {
  const [showConsentForm, setShowConsentForm] = useState(false);
  const [gdprManager] = useState(() => new GDPRManager());

  useEffect(() => {
    const initializeGDPR = async () => {
      await gdprManager.initialize();
      await gdprManager.start();

      // Check if consent form should be shown
      if (gdprManager.shouldShowConsentForm()) {
        setShowConsentForm(true);
      }
    };

    initializeGDPR();
  }, [gdprManager]);

  const handleConsent = async (consentType) => {
    await gdprManager.updateConsent(consentType);
    setShowConsentForm(false);
  };

  return (
    <>
      {showConsentForm && (
        <ConsentModal
          onConsent={handleConsent}
          privacyPolicyUrl="https://fluxgrid.app/privacy"
        />
      )}
      {/* App content */}
    </>
  );
}
```

## Props

### `ConsentModalProps`

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `onConsent` | `(consentType: ConsentType) => void \| Promise<void>` | Yes | - | Callback function called when user submits their consent choice |
| `privacyPolicyUrl` | `string` | No | `'https://fluxgrid.app/privacy'` | URL to the privacy policy page |

## ConsentType Enum

```typescript
enum ConsentType {
  PERSONALIZED = 'personalized',
  NON_PERSONALIZED = 'non-personalized',
  NONE = 'none'
}
```

## Behavior

### User Flow

1. Modal is displayed with two consent options
2. User selects either "Personalized Ads" or "Non-Personalized Ads"
3. Submit button becomes enabled
4. User clicks "Continue" button
5. `onConsent` callback is called with selected consent type
6. Loading state is shown during submission
7. Modal remains open until `onConsent` completes successfully

### Error Handling

If the `onConsent` callback throws an error:
- Error is logged to console
- Loading state is removed
- Submit button is re-enabled
- User can retry submission

### Accessibility

- All interactive elements are keyboard accessible
- Proper button roles and semantics
- Visual focus indicators
- High contrast text for readability

## Styling

The component uses Tailwind CSS classes and follows the FluxGrid cyberpunk theme:
- Dark background with blur effect
- Blue accent colors for selected state
- Gray tones for unselected state
- Smooth transitions and hover effects

## Testing

The component includes comprehensive unit tests covering:
- Rendering of all UI elements
- User interactions (selection, submission)
- Async callback handling
- Error handling
- Loading states
- Accessibility features

Run tests:
```bash
npm test -- src/components/ConsentModal.test.tsx
```

## Integration Checklist

- [ ] Initialize GDPRManager service
- [ ] Check if consent is required (`isConsentRequired()`)
- [ ] Check if consent form should be shown (`shouldShowConsentForm()`)
- [ ] Show ConsentModal when needed
- [ ] Handle consent submission with `updateConsent()`
- [ ] Hide modal after successful submission
- [ ] Provide privacy policy URL
- [ ] Test on EEA and non-EEA regions

## Related Components

- `GDPRManager` - Service for managing GDPR compliance
- `ErrorBoundary` - Error boundary for catching React errors
- `ErrorRecoveryModal` - Modal for displaying error recovery options

## Requirements Mapping

- **1.3**: Consent form provides "Personalized Ads" and "Non-Personalized Ads" options
- **1.5**: Privacy policy link is accessible in the consent form
- **1.7**: Users can update their consent through the modal (shown in settings)

## Future Enhancements

- [ ] Multi-language support (i18n integration)
- [ ] Animation on mount/unmount
- [ ] Additional consent options (analytics, marketing)
- [ ] Remember user's last selection
- [ ] Show consent version number
