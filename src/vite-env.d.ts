/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
  readonly VITE_ADMOB_BUILD_MODE?: 'test' | 'production';
  readonly VITE_ADMOB_APP_ID?: string;
  readonly VITE_ADMOB_BANNER_ID?: string;
  readonly VITE_ADMOB_INTERSTITIAL_ID?: string;
  readonly VITE_ADMOB_REWARDED_ID?: string;
  readonly VITE_ADMOB_TEST_DEVICE_IDS?: string;
  readonly VITE_ADMOB_CONSENT_DEBUG?: string;
  readonly VITE_ADMOB_CONSENT_DEBUG_GEOGRAPHY?: 'EEA' | 'US' | 'OTHER';
  readonly VITE_ADMOB_CONSENT_TEST_DEVICE_IDS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
