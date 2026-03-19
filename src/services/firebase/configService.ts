import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseFirestore } from './config';
import type { AppConfigDocument } from './types';

const CONFIG_CACHE_KEY = 'flux_app_config';
const CONFIG_CACHE_TTL = 5 * 60 * 1000; // 5 dakika

export async function getAppConfig(): Promise<AppConfigDocument | null> {
  // Önce cache'e bak
  try {
    const cached = localStorage.getItem(CONFIG_CACHE_KEY);
    if (cached) {
      const { data, fetchedAt } = JSON.parse(cached);
      if (Date.now() - fetchedAt < CONFIG_CACHE_TTL) {
        return data as AppConfigDocument;
      }
    }
  } catch {}

  // Firebase'den al
  try {
    const db = getFirebaseFirestore();
    const snap = await getDoc(doc(db, 'appConfig', 'v1'));
    
    if (!snap.exists()) return null;
    
    const data = snap.data() as AppConfigDocument;
    
    // Cache'e yaz
    localStorage.setItem(
      CONFIG_CACHE_KEY,
      JSON.stringify({ data, fetchedAt: Date.now() })
    );
    
    return data;
  } catch (err) {
    console.error('getAppConfig failed:', err);
    return null;
  }
}

export function isMaintenanceMode(config: AppConfigDocument | null): boolean {
  return config?.maintenanceMode === true;
}

export function getMaintenanceMessage(
  config: AppConfigDocument | null,
  lang: 'tr' | 'en' = 'tr'
): string {
  return (
    config?.maintenanceMessage?.[lang] ??
    'Sistem bakımda, lütfen daha sonra tekrar dene.'
  );
}
